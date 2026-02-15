"""API v1 routes for OKR validation and correction."""
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
    tags=["validation"],
)
async def validate_endpoint(payload: ValidateRequest) -> ValidateResponse:
    try:
        return run_validation(payload.raw_input)
    except Exception as exc:  # pragma: no cover - upstream LLM errors
        raise HTTPException(status_code=500, detail=f"Validation failed: {exc}") from exc


@router.post(
    "/validate/stream",
    summary="Validate an OKR submission with progress streaming",
    tags=["validation"],
)
async def validate_stream_endpoint(payload: ValidateRequest) -> StreamingResponse:
    """Stream validation progress using Server-Sent Events."""
    
    async def event_generator() -> AsyncGenerator[str, None]:
        event_queue: queue.Queue = queue.Queue()
        result_container = {"value": None}
        error_container = {"value": None}
        
        def progress_callback(event: ProgressEvent):
            """Callback to emit progress events."""
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
        
        # Start validation in background thread
        validation_thread = threading.Thread(target=run_validation_sync, daemon=True)
        validation_thread.start()
        
        # Stream progress events
        try:
            while True:
                try:
                    event_type, event_data = event_queue.get(timeout=1.0)
                    
                    if event_type == "progress":
                        yield f"data: {event_data.model_dump_json()}\n\n"
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
                    # Check if thread is still alive
                    if not validation_thread.is_alive() and result_container["value"] is None and error_container["value"] is None:
                        # Thread died unexpectedly
                        error_event = ProgressEvent(
                            event_type=ProgressEventType.STEP_ERROR,
                            step_id="error",
                            step_name="Validation Error",
                            step_number=0,
                            total_steps=5,
                            error="Validation thread terminated unexpectedly",
                        )
                        yield f"data: {error_event.model_dump_json()}\n\n"
                        break
                    continue
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
    tags=["correction"],
)
async def correct_endpoint(payload: CorrectionRequest) -> CorrectionResponse:
    try:
        return run_correction(payload.okr, payload.report)
    except Exception as exc:  # pragma: no cover - upstream LLM errors
        raise HTTPException(status_code=500, detail=f"Correction failed: {exc}") from exc


@router.post(
    "/correct/stream",
    summary="Correct an OKR submission with progress streaming",
    tags=["correction"],
)
async def correct_stream_endpoint(payload: CorrectionRequest) -> StreamingResponse:
    """Stream correction progress using Server-Sent Events."""
    
    async def event_generator() -> AsyncGenerator[str, None]:
        event_queue: queue.Queue = queue.Queue()
        result_container = {"value": None}
        error_container = {"value": None}
        
        def progress_callback(event: ProgressEvent):
            """Callback to emit progress events."""
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
        
        # Start correction in background thread
        correction_thread = threading.Thread(target=run_correction_sync, daemon=True)
        correction_thread.start()
        
        # Stream progress events
        try:
            while True:
                try:
                    event_type, event_data = event_queue.get(timeout=1.0)
                    
                    if event_type == "progress":
                        yield f"data: {event_data.model_dump_json()}\n\n"
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
                    # Check if thread is still alive
                    if not correction_thread.is_alive() and result_container["value"] is None and error_container["value"] is None:
                        # Thread died unexpectedly
                        error_event = ProgressEvent(
                            event_type=ProgressEventType.STEP_ERROR,
                            step_id="error",
                            step_name="Correction Error",
                            step_number=0,
                            total_steps=1,
                            error="Correction thread terminated unexpectedly",
                        )
                        yield f"data: {error_event.model_dump_json()}\n\n"
                        break
                    continue
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
