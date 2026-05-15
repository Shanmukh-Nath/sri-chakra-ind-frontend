// src/components/Dashboard/Dashboard.jsx

import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import styles from "./Dashboard.module.css";
import NavContainer from "./navs/NavContainer";
import DashHeader from "./DashHeader";
import FootLink from "./FootLink";

import { useAuth } from "../../Auth";
import { useDivision } from "../context/DivisionContext";
import DivisionSelector from "./DivisionSelector";
import { fetchWithDivision } from "../../utils/fetchWithDivision";

// Local skeletons
import PageSkeleton from "../SkeletonLoaders/PageSkeleton";
import RouteSkeleton from "../SkeletonLoaders/RouteSkeleton";
import HomePageSkeleton from "../SkeletonLoaders/HomePageSkeleton";
import TicketingService from "./TicketService/TicketingService";
import SettingRoutes from "./SettingsTab/SettingRoutes";
import ReportsRoutes from "./Reports/ReportsRoutes";

// Lazy-loaded Routes
const WelcomePage = lazy(() => import("../WelcomePage.jsx"));
const HomePage = lazy(() => import("./HomePage/HomePage"));
const InventoryRoutes = lazy(() => import("./Inventory/InventoryRoutes"));
const PurchaseRoutes = lazy(() => import("./Purchases/PurchaseRoutes"));
const SalesRoutes = lazy(() => import("./Sales/SalesRoutes"));
const CustomerRoutes = lazy(() => import("./Customers/CustomerRoutes"));
const FarmerRoutes = lazy(() => import("./Farmers/FarmerRoutes"));
const PaymentRoutes = lazy(() => import("./Payments/PaymentRoutes"));
const EmployeeRoutes = lazy(() => import("./Employees/EmployeeRoutes"));
const WarehouseRoutes = lazy(() => import("./Warehouses/WarehouseRoutes"));
const ProductRoutes = lazy(() => import("./Products/ProductRoutes"));
const Coils = lazy(() => import("./Products/Coils"));
const ViewCoils = lazy(() => import("./Products/ViewCoils"));
const EditCoilBatch = lazy(() => import("./Products/EditCoilBatch"));
const SampleRoutes = lazy(() => import("./Samples/SampleRoutes"));
const LocationsHome = lazy(() => import("./Locations/LocationsHome"));
const InvoiceRoutes = lazy(() => import("./Invoice/InvoiceRoutes"));
const StockRoutes = lazy(() => import("./StockTransfer/StockRoutes"));
const DiscountRoutes = lazy(() => import("./Discounts/DiscountRoutes"));
const TargetRoutes = lazy(() => import("./Targets/TargetRoutes"));
const ReturnRoutes = lazy(() => import("./Returns/ReturnRoutes"));
const TeamsRoutes = lazy(() => import("./Teams/TeamsRoutes"));
const DivisionManager = lazy(() => import("./DivisionManager"));
const StoresProducts = lazy(() => import("./Stores/StoresProducts"));
const StoresAbstract = lazy(() => import("./Stores/StoresAbstract"));

export default function Dashboard({
  admin,
  setAdmin,
  role,
  dept,
  setRoleclick,
  setBtnclick,
  orgadmin,
}) {
  const [storedUser, setStoredUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  });

  // Listen for user data changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          console.log(
            "Dashboard - User data updated from localStorage:",
            parsed
          );
          setStoredUser(parsed);
        }
      } catch (error) {
        console.error("Error updating stored user:", error);
      }
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);

    // Also check localStorage on mount
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const { axiosAPI, removeLogin } = useAuth();
  const {
    user: divisionUser,
    selectedDivision,
    showAllDivisions,
  } = useDivision();

  const [employees, setEmployees] = useState([]);

  // Add logging for context changes
  useEffect(() => {
    console.log("Dashboard - Context changed:", {
      selectedDivision,
      selectedDivisionName: selectedDivision?.name,
      selectedDivisionId: selectedDivision?.id,
      showAllDivisions,
      timestamp: new Date().toISOString(),
    });
  }, [selectedDivision, showAllDivisions]);

  // Listen for division change events to refresh data
  useEffect(() => {
    const handleRefreshData = (event) => {
      console.log("Dashboard - Received refreshData event:", event.detail);
      // The existing useEffect will automatically refetch data when selectedDivision changes
    };

    window.addEventListener("refreshData", handleRefreshData);
    return () => {
      window.removeEventListener("refreshData", handleRefreshData);
    };
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        // Extract division ID from the selectedDivision object
        const divisionId = selectedDivision?.id || null;

        console.log("Dashboard - selectedDivision object:", selectedDivision);
        console.log("Dashboard - extracted divisionId:", divisionId);
        console.log("Dashboard - showAllDivisions:", showAllDivisions);
        console.log(
          "Dashboard - final showAll flag:",
          showAllDivisions || divisionId === "all"
        );
        console.log("Dashboard - Division ID type check:", {
          divisionId,
          divisionIdType: typeof divisionId,
          isDivisionIdAll: divisionId === "all",
          isDivisionIdAllStrict: divisionId === "all",
          isDivisionIdAllLoose: divisionId == "all",
        });

        const data = await fetchWithDivision(
          "/employees",
          localStorage.getItem("accessToken"),
          divisionId, // Pass the ID, not the object
          showAllDivisions || divisionId === "all"
        );
        setEmployees(data.data || []);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    loadEmployees();
  }, [selectedDivision, showAllDivisions]);

  const [hover, setHover] = useState(false);
  const [style, setStyle] = useState("navcont");
  const [tab, setTab] = useState("home");
  const onmouseover = () => {
    setHover(true);
    setStyle("navover");
  };
  const onmouseleave = () => {
    setHover(false);
    setStyle("navcont");
  };

  // 🔧 Admin routing logic fix
  if (admin === true) {
    return <Navigate to="/admin" />;
  }

  return (
    <>
      {/* Only show DivisionSelector when no division is selected */}
      {!selectedDivision && (
        <>
          {console.log(
            "Dashboard - Showing DivisionSelector because selectedDivision is:",
            selectedDivision
          )}
          <DivisionSelector userData={storedUser} />
        </>
      )}
      {selectedDivision && (
        <>
          {console.log(
            "Dashboard - Hiding DivisionSelector because selectedDivision is:",
            selectedDivision
          )}
        </>
      )}

      <div className="container-fluid py-0 my-0">
        <div className="row py-0 my-0 pr-0">
          <div
            className={`col ${styles[style]}`}
            onMouseOver={onmouseover}
            onMouseLeave={onmouseleave}
          >
            <NavContainer
              hover={hover}
              onmouseover={onmouseover}
              onmouseleave={onmouseleave}
              style={style}
              setTab={setTab}
              tab={tab}
              admin={admin}
              orgadmin={orgadmin}
            />
          </div>

          <div className="col p-0">
            <div className={`row p-0 ${styles.headline}`}>
              <DashHeader
                notifications={null}
                user={storedUser}
                setRoleclick={setRoleclick}
                setBtnclick={setBtnclick}
                setTab={setTab}
                admin={admin}
                setAdmin={setAdmin}
                orgadmin={orgadmin}
              />
            </div>

            <div className={`col ${styles.tabs}`}>
              <Routes>
                <Route
                  index
                  element={
                    <Suspense fallback={<HomePageSkeleton />}>
                      <HomePage />
                    </Suspense>
                  }
                />
                <Route
                  path="/inventory/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <InventoryRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/purchases/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <PurchaseRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/sales/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <SalesRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/invoices/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <InvoiceRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/customers/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <CustomerRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/farmers/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <FarmerRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/payments/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <PaymentRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/stock-transfer/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <StockRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/employees/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <EmployeeRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/discounts/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <DiscountRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/locations/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <LocationsHome />
                    </Suspense>
                  }
                />
                <Route
                  path="/warehouses/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <WarehouseRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/products/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <ProductRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/coils/view"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <ViewCoils />
                    </Suspense>
                  }
                />
                <Route
                  path="/coils/edit/:batchId"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <EditCoilBatch />
                    </Suspense>
                  }
                />
                <Route
                  path="/coils"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <Coils />
                    </Suspense>
                  }
                />
                <Route
                  path="/samples/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <SampleRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/targets/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <TargetRoutes />
                    </Suspense>
                  }
                />

                <Route
                  path="/reports/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <ReportsRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/returns/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <ReturnRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/teams/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <TeamsRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/settings/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <SettingRoutes />
                    </Suspense>
                  }
                />
                <Route
                  path="/divisions/*"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <DivisionManager />
                    </Suspense>
                  }
                />
                <Route
                  path="/stores-products"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <StoresProducts />
                    </Suspense>
                  }
                />
                <Route
                  path="/stores-abstract"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <StoresAbstract />
                    </Suspense>
                  }
                />
              </Routes>
            </div>
          </div>
        </div>
      </div>

      <FootLink />
      <TicketingService />
    </>
  );
}
