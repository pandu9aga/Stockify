from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
from app.services.forecaster import forecasting_service

app = FastAPI(
    title="Stockify ML Service",
    description="PyTorch Powered Time-Series Demand Forecasting & Reorder Optimization",
    version="1.0.0"
)

class ForecastRequest(BaseModel):
    product_id: int
    product_name: str = ""
    current_stock: int = Field(ge=0, description="Current warehouse stock")
    sales_history: List[float] = Field(default=[], description="Historical daily outbound quantities")
    lead_time_days: int = Field(default=3, ge=1, description="Supplier lead time in days")

class ForecastResponse(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    daily_forecast_next_7_days: List[float]
    total_demand_next_7_days: float
    average_daily_demand: float
    reorder_point: int
    safety_stock: int
    estimated_days_until_stockout: float
    restock_recommended: bool

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Stockify ML Engine (PyTorch CPU)"}

@app.post("/api/predict", response_model=ForecastResponse)
def predict_stock_demand(req: ForecastRequest):
    try:
        result = forecasting_service.predict_demand(
            history=req.sales_history,
            current_stock=req.current_stock,
            lead_time_days=req.lead_time_days
        )
        return {
            "product_id": req.product_id,
            "product_name": req.product_name,
            "current_stock": req.current_stock,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

