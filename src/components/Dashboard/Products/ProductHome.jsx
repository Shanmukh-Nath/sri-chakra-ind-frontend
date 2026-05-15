import React, { useEffect, useState, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "@/components/ReusableCard";
import ChartComponent from "@/components/ChartComponent";
import DeleteProductViewModal from "./DeleteProductViewModal";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import styles from "../Dashboard.module.css";

function ProductHome({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProductDashboard() {
      try {
        setLoading(true);

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to endpoint
        let endpoint = "/dashboard/products";
        if (currentDivisionId && currentDivisionId !== "1") {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          endpoint += `?showAllDivisions=true`;
        }

        console.log(
          "ProductHome - Fetching product dashboard with endpoint:",
          endpoint,
        );
        console.log("ProductHome - Division ID:", currentDivisionId);
        console.log("ProductHome - Division Name:", currentDivisionName);

        const res = await axiosAPI.get(endpoint);
        console.log("Product Dashboard Response:", res.data);
        setProductData(res.data);
      } catch (err) {
        console.error("Product dashboard fetch error:", err);
        setError(
          err?.response?.data?.message || "Failed to load product dashboard",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchProductDashboard();
  }, []);

  // Transform backend data for Chart.js format
  const trendData = React.useMemo(() => {
    if (
      !productData?.productsAddedTrend ||
      !Array.isArray(productData.productsAddedTrend)
    ) {
      return {
        labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [
          {
            label: "Products Added",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: "#2a4d9b",
            backgroundColor: "rgba(42,77,155,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      };
    }

    const labels = productData.productsAddedTrend.map((item) => item.month);
    const data = productData.productsAddedTrend.map((item) => item.count);

    return {
      labels,
      datasets: [
        {
          label: "Products Added",
          data,
          borderColor: "#2a4d9b",
          backgroundColor: "rgba(42,77,155,0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [productData?.productsAddedTrend]);

  const topStockData = React.useMemo(() => {
    if (
      !productData?.topProductsByStock ||
      !Array.isArray(productData.topProductsByStock)
    ) {
      return {
        labels: ["No Products"],
        datasets: [
          {
            label: "Stock Qty",
            data: [0],
            backgroundColor: ["#4e73df"],
          },
        ],
      };
    }

    const labels = productData.topProductsByStock.map((item) => item.product);
    const data = productData.topProductsByStock.map((item) => item.stock);

    return {
      labels,
      datasets: [
        {
          label: "Stock Qty",
          data,
          backgroundColor: [
            "#4e73df",
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b",
            "#858796",
            "#ff6384",
            "#36a2eb",
            "#cc65fe",
            "#ffce56",
          ],
        },
      ],
    };
  }, [productData?.topProductsByStock]);

  return (
    <>
      {/* Buttons - Always visible */}
      <div className="row m-0 p-3">
        <div className="col">
          {isAdmin && (
            <>
              <button
                className="homebtn"
                onClick={() => navigate("/products/add")}
              >
                + Add
              </button>
              <DeleteProductViewModal />
            </>
          )}
          <button
            className="homebtn"
            onClick={() => navigate("/products/modify")}
          >
            Ongoing
          </button>
          {/*<button
            className="homebtn"
            onClick={() => navigate("/products/pricing-list")}
          >
            Pricing List
          </button>*/}
          <button
            className="homebtn"
            onClick={() => navigate("/products/taxes")}
          >
            Taxes
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/coils")}
          >
            Coils
          </button>
        </div>
      </div>

      {/* Cards */}
      <Flex wrap="wrap" justify="space-between" px={4}>
        <ReusableCard
          title="Total Products"
          value={productData?.totalProducts ?? (loading ? <Loading /> : "0")}
        />
        <ReusableCard
          title="Active Products"
          value={productData?.activeProducts ?? (loading ? <Loading /> : "0")}
          color="green.500"
        />
        <ReusableCard
          title="Warehouses Stocking Products"
          value={
            productData?.warehousesStockingProducts ??
            (loading ? <Loading /> : "0")
          }
          color="blue.500"
        />
        <ReusableCard
          title="Low Stock Alerts"
          value={productData?.lowStockAlerts ?? (loading ? <Loading /> : "0")}
          color="red.500"
        />
      </Flex>

      {/* Charts */}
      <div className={styles["charts-grid"]}>
        {trendData &&
          trendData.datasets &&
          trendData.datasets[0] &&
          trendData.datasets[0].data &&
          trendData.datasets[0].data.length > 0 && (
            <ChartComponent
              type="line"
              title="Products Added Trend"
              data={trendData}
              options={{ responsive: true }}
            />
          )}
        {topStockData &&
          topStockData.datasets &&
          topStockData.datasets[0] &&
          topStockData.datasets[0].data &&
          topStockData.datasets[0].data.length > 0 && (
            <ChartComponent
              type="doughnut"
              title="Top Products by Stock"
              data={topStockData}
              options={{ responsive: true }}
              legendPosition="left"
            />
          )}
      </div>
    </>
  );
}

export default ProductHome;
