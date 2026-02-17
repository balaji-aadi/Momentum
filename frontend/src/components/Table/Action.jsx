import React from "react";
import { MdModeEdit } from "react-icons/md";
import "./table.style.css";
import { useStoreData } from "../../store/SharedStore";
import { FaRegEye } from "react-icons/fa";
import { AiTwotoneDelete } from "react-icons/ai";
import toast from "react-hot-toast";
import { RxCross2 } from "react-icons/rx";

const Action = ({
  params,
  setShowDetails,
  show,
  handleDeleteApi,
  setError,
  setLoading,
  deactivate,
  finalProductUpdate,
}) => {
  const {
    setEditSwitch,
    setEditHeading,
    singleRowDataFunction,
    setOpenDeactivateModal,
    setUpdatedId,
    setIsProductUpdate,
  } = useStoreData();

  const handleEdit = () => {
    const data = params.data;
    setEditSwitch(true);
    setEditHeading(true);
    singleRowDataFunction(data);
  };
  const handleDelete = async () => {
    const id = params.data?.id;
    try {
      setError(false);
      setLoading(true);
      await handleDeleteApi(id);
      toast.success("Data Deleted Successfully");
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = () => {
    const data = params.data;
    setOpenDeactivateModal(true);
    singleRowDataFunction(data);
  };

  const handleSeeDetails = () => {
    const data = params.data;
    singleRowDataFunction(data);
    setShowDetails(true);
  };

  const handleFinalProductEdit = () => {
    const data = params.data;
    setEditSwitch(true);
    setEditHeading(true);
    setUpdatedId(data?.id);
    setIsProductUpdate(true);
  };

  return (
    <div className="action__container">
      <span className="action__details">
        {show && (
          <i style={{ color: "#005dae" }}>
            <FaRegEye onClick={handleSeeDetails} />
          </i>
        )}
        {!finalProductUpdate ? (
          <i>
            <MdModeEdit onClick={handleEdit} />
          </i>
        ) : (
          <i>
            <MdModeEdit onClick={handleFinalProductEdit} />
          </i>
        )}

        {handleDeleteApi && (
          <i style={{ color: "red" }}>
            <AiTwotoneDelete onClick={handleDelete} />
          </i>
        )}
        {deactivate && (
          <i style={{ color: "#bab9b8" }}>
            <RxCross2 onClick={handleDeactivate} />
          </i>
        )}
      </span>
    </div>
  );
};

export default Action;
