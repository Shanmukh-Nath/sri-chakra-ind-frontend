import React, { useEffect, useState, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "@/components/ReusableCard";
import ChartComponent from "@/components/ChartComponent";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import styles from "../Dashboard.module.css";

function InventoryHome({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchInventoryDashboard() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/dashboard/inventory");
        console.log("Inventory Dashboard Response:", res.data);
        setInventoryData(res.data);
      } catch (err) {
        console.error("Inventory dashboard fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load inventory dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchInventoryDashboard();
  }, []);

  // Transform backend arrays for Chart.js
  const trendData = useMemo(() => {
    if (!inventoryData?.stockLevelTrend || !Array.isArray(inventoryData.stockLevelTrend)) {
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Stock Level",
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: "rgba(42,77,155,0.1)",
            borderColor: "#2a4d9b",
            fill: true,
            tension: 0.3,
          },
        ],
      };
    }

    const labels = inventoryData.stockLevelTrend.map(item => item.month || item.label || item.date || "");
    const data = inventoryData.stockLevelTrend.map(item => item.value ?? item.stock ?? 0);

    return {
      labels,
      datasets: [
        {
          label: "Stock Level",
          data,
          backgroundColor: "rgba(42,77,155,0.1)",
          borderColor: "#2a4d9b",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [inventoryData?.stockLevelTrend]);

  const warehouseData = useMemo(() => {
    if (!inventoryData?.stockByWarehouse || !Array.isArray(inventoryData.stockByWarehouse)) {
      return {
        labels: ["No Warehouses"],
        datasets: [
          {
            label: "Stock",
            data: [0],
            backgroundColor: ["#4e73df"],
          },
        ],
      };
    }

    const labels = inventoryData.stockByWarehouse.map(item => item.warehouse || item.label || "");
    const data = inventoryData.stockByWarehouse.map(item => item.stock ?? 0);

    return {
      labels,
      datasets: [
        {
          label: "Stock",
          data,
          backgroundColor: ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b", "#858796", "#ff6384", "#36a2eb", "#cc65fe", "#ffce56"],
        },
      ],
    };
  }, [inventoryData?.stockByWarehouse]);

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="container-fluid">
          <div className="row m-0 p-3">
            <div className="col text-center">
              <div className="alert alert-danger">
                <strong>Error loading inventory dashboard</strong>
                <br />
                <small>{error}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buttons - Always visible */}
      <div className="row m-0 p-3">
        <div className="col">
            <div
              style={{
                marginBottom: "16px",
                padding: "16px 18px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #fff7ed, #eff6ff)",
                border: "1px solid #dbeafe",
                color: "#334155",
                lineHeight: 1.7,
              }}
            >
              <strong>First-time inventory setup:</strong> Set products with one clean stock unit, add selling units with conversion rules, then use `Direct Stock In` for opening or supplier stock. Warehouse stock will stay in one system value while staff can still see it as sheets, coils, or rmt.
            </div>
            <div
              style={{
                marginBottom: "16px",
                padding: "16px 18px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #eff6ff, #f8fafc)",
                border: "1px solid #bfdbfe",
                color: "#1e3a8a",
                lineHeight: 1.7,
              }}
            >
              <strong>Steel mode:</strong> use <code>Steel Settings</code> to lock
              the base calculation unit to kg while letting accountants choose
              display units, then use <code>Coil Ledger</code> and{" "}
              <code>Production Journal</code> for raw coil, finished sheet, and
              scrap tracking.
            </div>
            <button
      className="homebtn"
      onClick={() => navigate("/inventory/direct-stock-in")}
    >
      + Direct Stock In
    </button>
            <button className='homebtn' onClick={() => navigate('/inventory/incoming-stock')}>Incoming Stock</button>
            <button className='homebtn' onClick={() => navigate('/inventory/outgoing-stock')}>Outgoing Stock</button>
            <button className='homebtn' onClick={() => navigate('/inventory/current-stock')}>Current Stock</button>
            <button className='homebtn' onClick={() => navigate('/inventory/stock-summary')}>Stock Summary</button>
            <button className='homebtn' onClick={() => navigate('/inventory/steel-settings')}>Steel Settings</button>
            <button className='homebtn' onClick={() => navigate('/inventory/coil-ledger')}>Coil Ledger</button>
            <button className='homebtn' onClick={() => navigate('/inventory/production-journal')}>Production Journal</button>
            <button className='homebtn' onClick={() => navigate('/inventory/damaged-goods')}>Damaged Goods</button>
            <button className='homebtn' onClick={() => navigate('/inventory/manage-stock')}>Stock Adjustment</button>
        </div>
      </div>

      {/* Cards */}
      <Flex wrap="wrap" justify="space-between" px={4}>
        <ReusableCard 
          title="Total Inventory Value" 
          value={inventoryData?.totalInventoryValue || (loading ? <Loading /> : "₹8.2L")} 
        />
        <ReusableCard 
          title="Outgoing" 
          value={inventoryData?.outgoingValue || (loading ? <Loading /> : "₹30K")} 
          color="red.500" 
        />
        <ReusableCard 
          title="Damaged Stock" 
          value={inventoryData?.damagedStockValue || (loading ? <Loading /> : "₹12K")} 
          color="yellow.500" 
        />
      </Flex>

      {/* Charts */}
      <div className={styles["charts-grid"]}>
        <ChartComponent
          type="line"
          title="Stock Level Trend"
          data={trendData}
          options={{ responsive: true }}
        />
        <ChartComponent
          type="doughnut"
          title="Stock by Warehouse"
          data={warehouseData}
          options={{ responsive: true }}
          legendPosition="left"
        />
      </div>
    </>
  );
}

export default InventoryHome;
