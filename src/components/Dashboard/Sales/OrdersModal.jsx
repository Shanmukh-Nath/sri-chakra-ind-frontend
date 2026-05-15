import React from "react";

import styles from "./Sales.module.css";
import { DialogActionTrigger } from "@/components/ui/dialog";

function formatCoilNumber(item) {
  const num =
    item?.coilNumber != null ? String(item.coilNumber).trim() : "";
  return num || "—";
}

function formatCoilSheet(item) {
  const sheet = item?.coilSheet != null ? String(item.coilSheet).trim() : "";
  return sheet || "—";
}

function OrdersModal({orderdata}) {
  const items = Array.isArray(orderdata?.items) ? orderdata.items : [];
  const onSubmit = (e) => e.preventDefault();

  let count = 1;
  return (
    <>
      <h3 className={`px-3 mdl-title`}>Orders</h3>
      <div className="row m-0 p-0">
        <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">Date :</label>
                  <input type="date" value={orderdata.createdAt.slice(0, 10)} />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">Order ID :</label>
                  <input type="text" value={orderdata.orderNumber} />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">Warehouse ID :</label>
                  <input type="text" value={orderdata.warehouse.id} />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">Warehouse Name :</label>
                  <input type="text" value={orderdata.warehouse.name} />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">Customer ID :</label>
                  <input type="text" value={orderdata.customer.customer_id} />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">Customer Name :</label>
                  <input type="text" value={orderdata.customer.name} />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">SE ID :</label>
                  <input type="text" value={orderdata.salesExecutive.id} />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">SE Name :</label>
                  <input type="text" value={orderdata.salesExecutive.name} />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                  <label htmlFor="">Txn Amount :</label>
                  <input type="text" value={orderdata.totalAmount} />
                </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Payment mode :</label>
          <input type="text" value={"UPI"} />
        </div>
      </div>

      <div className="row m-0 p-0 justify-content-center">
        <h5 className={styles.headmdl}>Products</h5>
        <div className="col-10">
          <table
            className={`table table-bordered borderedtable ${styles.mdltable}`}
          >
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Units</th>
                <th>Quantity</th>
                <th>Net Amount</th>
              </tr>
            </thead>
            <tbody>
            {items.length === 0 && <tr>
                <td colSpan={8}>No DATA FOUND</td>
              </tr>}
              {items.length > 0 && items.map((item) => {
                const qty = Number(item?.quantity ?? item?.qty);
                const displayQty = Number.isFinite(qty) ? qty : item?.quantity ?? "—";
                return (
                <tr key={item.id ?? item.productId ?? count}>
                <td>{count++}</td>
                <td>{item.productId ?? item.SKU}</td>
                <td>{item.productName || item.name || item.product?.name}</td>
                <td>{item.unit || item.product?.unit}</td>
                <td>{displayQty}</td>
                <td>{formatCoilNumber(item)}</td>
                <td>{formatCoilSheet(item)}</td>
                <td>{item.totalPrice ?? item.netAmount}</td>
              </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* <div className="row m-0 p-3 pt-4 justify-content-center">
        <div className={`col-2`}>
        <button className="submitbtn">Download</button>
          { <DialogActionTrigger asChild>
            <button className="cancelbtn">Cancel</button>
          </DialogActionTrigger> }
        </div>
      </div> */}
    </>
  );
}

export default OrdersModal;
