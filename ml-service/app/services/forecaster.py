import torch
import numpy as np
from app.models.lstm_model import StockDemandLSTM

class ForecastingService:
    def __init__(self):
        self.device = torch.device("cpu")
        self.model = StockDemandLSTM(input_size=1, hidden_size=64, num_layers=2, output_size=7)
        self.model.eval()

    def predict_demand(self, history: list[float], current_stock: int, lead_time_days: int = 3) -> dict:
        """
        history: array of daily outbound quantities (minimum 14 data points recommended)
        current_stock: remaining physical stock in warehouse
        lead_time_days: days required for supplier delivery
        """
        if not history:
            history = [0.0] * 14

        if len(history) < 14:
            # Pad with average or repeat
            pad_val = float(np.mean(history)) if len(history) > 0 else 1.0
            history = [pad_val] * (14 - len(history)) + history
        else:
            history = history[-14:]

        arr = np.array(history, dtype=np.float32)
        min_val, max_val = float(np.min(arr)), float(np.max(arr))
        denom = (max_val - min_val) if (max_val - min_val) > 0 else 1.0

        # MinMax normalisation
        norm_data = (arr - min_val) / denom
        inp_tensor = torch.tensor(norm_data, dtype=torch.float32).unsqueeze(0).unsqueeze(-1)

        with torch.no_grad():
            preds_norm = self.model(inp_tensor).squeeze(0).numpy()

        # Invert scaling
        preds = np.clip(preds_norm * denom + min_val, a_min=0, a_max=None)
        daily_forecast = [round(float(p), 1) for p in preds]
        total_forecast_7d = round(float(np.sum(daily_forecast)), 1)
        
        # Calculation for Reorder Point (ROP) = (Avg Daily Demand * Lead Time) + Safety Stock
        avg_daily = float(np.mean(daily_forecast)) if total_forecast_7d > 0 else 1.0
        safety_stock = round(avg_daily * 2) # 2 days buffer
        reorder_point = round((avg_daily * lead_time_days) + safety_stock)
        
        days_until_out = round(current_stock / avg_daily, 1) if avg_daily > 0 else 999.0
        restock_recommended = current_stock <= reorder_point

        return {
            "daily_forecast_next_7_days": daily_forecast,
            "total_demand_next_7_days": total_forecast_7d,
            "average_daily_demand": round(avg_daily, 1),
            "reorder_point": reorder_point,
            "safety_stock": safety_stock,
            "estimated_days_until_stockout": days_until_out,
            "restock_recommended": restock_recommended
        }

forecasting_service = ForecastingService()

