import React, { useEffect, useState } from "react";
import styles from "./Sales.module.css";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import OrdersModal from "./OrdersModal";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
function OrdersViewModal({ order }) {
  const [orderdata, setOrderdata] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const { axiosAPI } = useAuth();
  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/sales-orders/order/${order.id}`);
        const raw = res.data;
        const orderRoot = raw?.order || raw?.salesOrder;
        const normalized = orderRoot
          ? {
              ...orderRoot,
              items:
                raw?.items ??
                orderRoot?.items ??
                raw?.salesOrderItems ??
                [],
            }
          : raw;
        setOrderdata(normalized);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        // setIsModalOpen(true)
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);
  return (
    <>
      {!orderdata && !loading && <span className="text-denger">{error}</span>}
      {orderdata && (
        <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
          <DialogTrigger asChild>
            <button>view</button>
          </DialogTrigger>
          <DialogContent className="mdl">
            <DialogBody>
              <OrdersModal orderdata={orderdata} />
            </DialogBody>
            <DialogCloseTrigger className="inputcolumn-mdl-close" />
          </DialogContent>
        </DialogRoot>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <span>loading..</span>}
    </>
  );
}

export default OrdersViewModal;
