import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const Home = () => {
  const [show, setShow] = useState(false);

  const handleOpen = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100 align-items-center">
        <div className="col-12 col-lg-8 col-md-8 border-end min-vh-100">
          <div className="p-4 w-75">
            <div className="border rounded p-3 d-flex gap-3">
              <div className="bg-danger text-white p-4 rounded flex-grow-1 text-center w-25">
                <h4>In-Store Order</h4>
                <i className="bi bi-cup-straw fs-1"></i>
              </div>
              <div className="bg-light p-4 rounded flex-grow-1 text-center">
                <h4 className="text-warning">Phone Order</h4>
                <button
                  className="btn btn-outline-dark shadow-sm w-100 my-2"
                  onClick={handleOpen}
                >
                  Collection
                </button>
                <button
                  className="btn btn-outline-dark shadow-sm w-100"
                  onClick={handleOpen}
                >
                  Delivery
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4 col-md-4">
          <div className="p-4 text-center">
            <img
              src="/images/looker-icon.png"
              alt="no orders"
              style={{ width: "100px" }}
            />
            <h5 className="text-success mt-3">
              Looks like you are all caught up!
            </h5>
            <p>You have no outstanding orders.</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered className="text-center">
        <Modal.Header className="justify-content-center">
          <Modal.Title>Start New Phone Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>No customer is currently on the line. Do you still want to proceed?</p>
          <p className="text-muted">
            If you're placing an order in person, we recommend using the red In-Store button instead.
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button
            variant="light"
            className="text-dark shadow-sm"
            onClick={handleClose}
          >
            Go Back
          </Button>
          <Link to="/live-order"
            className="btn btn-outline-dark"
            onClick={() => {
              handleClose();
              // trigger order start logic here
            }}
          >
            Start Order
          </Link>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Home;