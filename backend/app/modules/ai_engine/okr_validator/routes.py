"""API v1 routes for OKR validation and correction."""
import asyncio
import queue
import threading
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.modules.ai_engine.okr_validator.api_schemas import CorrectionRequest, CorrectionResponse, ValidateRequest, ValidateResponse
from app.core.logging_config import logger
from app.modules.ai_engine.okr_validator.schemas.progress import ProgressEvent, ProgressEventType
from app.modules.ai_engine.okr_validator.services.runner import run_correction, run_validation

router = APIRouter(prefix="/v1")


@router.post(
    "/validate",
    response_model=ValidateResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate an OKR submission",
)
async def validate_endpoint(payload: ValidateRequest) -> ValidateResponse:
    try:
        return run_validation(payload.raw_input)
    except Exception as exc:  # pragma: no cover - upstream LLM errors
        raise HTTPException(status_code=500, detail=f"Validation failed: {exc}") from exc


@router.post(
    "/validate/stream",
    summary="Validate an OKR submission with progress streaming",
)
async def validate_stream_endpoint(payload: ValidateRequest) -> StreamingResponse:
    """Stream validation progress using Server-Sent Events."""
    
    async def event_generator() -> AsyncGenerator[str, None]:
        event_queue: queue.Queue = queue.Queue()
        result_container = {"value": None}
        error_container = {"value": None}
        done_flag = threading.Event()
        
        def progress_callback(event: ProgressEvent):
            """Callback to emit progress events."""
            logger.info(f"[STREAM] Emitting validation progress event: {event.event_type}, step {event.step_number}/{event.total_steps}, name: {event.step_name}")
            event_queue.put(("progress", event))
        
        def run_validation_sync():
            """Run validation in background thread."""
            try:
                result = run_validation(payload.raw_input, progress_callback=progress_callback)
                result_container["value"] = result
                event_queue.put(("complete", None))
            except Exception as e:
                logger.error(f"Validation error: {e}", exc_info=True)
                error_container["value"] = str(e)
                event_queue.put(("error", None))
            finally:
                done_flag.set()
        
        # Start validation in background thread
        validation_thread = threading.Thread(target=run_validation_sync, daemon=True)
        validation_thread.start()
        
        # Stream progress events in real-time
        try:
            while not done_flag.is_set() or not event_queue.empty():
                try:
                    # Use very short timeout for responsive streaming
                    event_type, event_data = event_queue.get(timeout=0.05)
                    
                    if event_type == "progress":
                        # Flush immediately - this is critical for real-time updates
                        logger.info(f"[STREAM] Sending validation progress event to client: {event_data.event_type}, step {event_data.step_number}")
                        yield f"data: {event_data.model_dump_json()}\n\n"
                        # Force flush by yielding empty string
                        await asyncio.sleep(0)
                    elif event_type == "complete":
                        # Send final result
                        complete_event = ProgressEvent(
                            event_type=ProgressEventType.COMPLETE,
                            step_id="complete",
                            step_name="Validation Complete",
                            step_number=5,
                            total_steps=5,
                            message="Validation completed successfully",
                            data={"result": result_container["value"].model_dump(by_alias=True)},
                        )
                        yield f"data: {complete_event.model_dump_json()}\n\n"
                        break
                    elif event_type == "error":
                        error_event = ProgressEvent(
                            event_type=ProgressEventType.STEP_ERROR,
                            step_id="error",
                            step_name="Validation Error",
                            step_number=0,
                            total_steps=5,
                            error=error_container["value"],
                        )
                        yield f"data: {error_event.model_dump_json()}\n\n"
                        break
                except queue.Empty:
                    # Small async sleep to prevent busy waiting
                    await asyncio.sleep(0.01)
                    continue
            
            # Check for any remaining events or final state
            if not event_queue.empty():
                try:
                    while True:
                        event_type, event_data = event_queue.get_nowait()
                        if event_type == "progress":
                            logger.info(f"[STREAM] Sending queued validation progress event: {event_data.event_type}, step {event_data.step_number}")
                            yield f"data: {event_data.model_dump_json()}\n\n"
                            await asyncio.sleep(0)
                except queue.Empty:
                    pass
            
            # Final check for completion
            if result_container["value"] is not None and not done_flag.is_set():
                complete_event = ProgressEvent(
                    event_type=ProgressEventType.COMPLETE,
                    step_id="complete",
                    step_name="Validation Complete",
                    step_number=5,
                    total_steps=5,
                    message="Validation completed successfully",
                    data={"result": result_container["value"].model_dump(by_alias=True)},
                )
                yield f"data: {complete_event.model_dump_json()}\n\n"
            elif error_container["value"] is not None:
                error_event = ProgressEvent(
                    event_type=ProgressEventType.STEP_ERROR,
                    step_id="error",
                    step_name="Validation Error",
                    step_number=0,
                    total_steps=5,
                    error=error_container["value"],
                )
                yield f"data: {error_event.model_dump_json()}\n\n"
        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            error_event = ProgressEvent(
                event_type=ProgressEventType.STEP_ERROR,
                step_id="error",
                step_name="Stream Error",
                step_number=0,
                total_steps=5,
                error=str(e),
            )
            yield f"data: {error_event.model_dump_json()}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/correct",
    response_model=CorrectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Correct an OKR submission and return the improved draft",
)
async def correct_endpoint(payload: CorrectionRequest) -> CorrectionResponse:
    try:
        return run_correction(payload.okr, payload.report)
    except Exception as exc:  # pragma: no cover - upstream LLM errors
        raise HTTPException(status_code=500, detail=f"Correction failed: {exc}") from exc


@router.post(
    "/correct/stream",
    summary="Correct an OKR submission with progress streaming",
)
async def correct_stream_endpoint(payload: CorrectionRequest) -> StreamingResponse:
    """Stream correction progress using Server-Sent Events."""
    
    async def event_generator() -> AsyncGenerator[str, None]:
        event_queue: queue.Queue = queue.Queue()
        result_container = {"value": None}
        error_container = {"value": None}
        done_flag = threading.Event()
        
        def progress_callback(event: ProgressEvent):
            """Callback to emit progress events."""
            logger.info(f"[STREAM] Emitting correction progress event: {event.event_type}, step {event.step_number}/{event.total_steps}, name: {event.step_name}")
            event_queue.put(("progress", event))
        
        def run_correction_sync():
            """Run correction in background thread."""
            try:
                result = run_correction(payload.okr, payload.report, progress_callback=progress_callback)
                result_container["value"] = result
                event_queue.put(("complete", None))
            except Exception as e:
                logger.error(f"Correction error: {e}", exc_info=True)
                error_container["value"] = str(e)
                event_queue.put(("error", None))
            finally:
                done_flag.set()
        
        # Start correction in background thread
        correction_thread = threading.Thread(target=run_correction_sync, daemon=True)
        correction_thread.start()
        
        # Stream progress events in real-time
        try:
            while not done_flag.is_set() or not event_queue.empty():
                try:
                    # Use very short timeout for responsive streaming
                    event_type, event_data = event_queue.get(timeout=0.05)
                    
                    if event_type == "progress":
                        # Flush immediately - this is critical for real-time updates
                        logger.info(f"[STREAM] Sending correction progress event to client: {event_data.event_type}, step {event_data.step_number}")
                        yield f"data: {event_data.model_dump_json()}\n\n"
                        # Force flush by yielding empty string
                        await asyncio.sleep(0)
                    elif event_type == "complete":
                        # Send final result
                        complete_event = ProgressEvent(
                            event_type=ProgressEventType.COMPLETE,
                            step_id="complete",
                            step_name="Correction Complete",
                            step_number=1,
                            total_steps=1,
                            message="Correction completed successfully",
                            data={"result": result_container["value"].model_dump(by_alias=True)},
                        )
                        yield f"data: {complete_event.model_dump_json()}\n\n"
                        break
                    elif event_type == "error":
                        error_event = ProgressEvent(
                            event_type=ProgressEventType.STEP_ERROR,
                            step_id="error",
                            step_name="Correction Error",
                            step_number=0,
                            total_steps=1,
                            error=error_container["value"],
                        )
                        yield f"data: {error_event.model_dump_json()}\n\n"
                        break
                except queue.Empty:
                    # Small async sleep to prevent busy waiting
                    await asyncio.sleep(0.01)
                    continue
            
            # Check for any remaining events or final state
            if not event_queue.empty():
                try:
                    while True:
                        event_type, event_data = event_queue.get_nowait()
                        if event_type == "progress":
                            logger.info(f"[STREAM] Sending queued correction progress event: {event_data.event_type}, step {event_data.step_number}")
                            yield f"data: {event_data.model_dump_json()}\n\n"
                            await asyncio.sleep(0)
                except queue.Empty:
                    pass
            
            # Final check for completion
            if result_container["value"] is not None and not done_flag.is_set():
                complete_event = ProgressEvent(
                    event_type=ProgressEventType.COMPLETE,
                    step_id="complete",
                    step_name="Correction Complete",
                    step_number=1,
                    total_steps=1,
                    message="Correction completed successfully",
                    data={"result": result_container["value"].model_dump(by_alias=True)},
                )
                yield f"data: {complete_event.model_dump_json()}\n\n"
            elif error_container["value"] is not None:
                error_event = ProgressEvent(
                    event_type=ProgressEventType.STEP_ERROR,
                    step_id="error",
                    step_name="Correction Error",
                    step_number=0,
                    total_steps=1,
                    error=error_container["value"],
                )
                yield f"data: {error_event.model_dump_json()}\n\n"
        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            error_event = ProgressEvent(
                event_type=ProgressEventType.STEP_ERROR,
                step_id="error",
                step_name="Stream Error",
                step_number=0,
                total_steps=1,
                error=str(e),
            )
            yield f"data: {error_event.model_dump_json()}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
