import React, { useEffect, useState } from 'react'
import SharedInputs from '../../Shared/SharedInputs'
import { useStoreData } from '../../store/SharedStore'
import Loader from '../../components/Loader'
import SomethingWentWrong from '../../components/ErrorPage'
import toast from 'react-hot-toast'
import { MasterApi } from '../../services/api/masterApi'

const MastersDataSub = () => {
 const {masterDetails,setIsUpdate, isUpdate, singleRowData} = useStoreData()
 const [loading,setLoading] = useState(false)
 const [error, setError] = useState(false)
 console.log(masterDetails)

 
 const [masterDataForm, setMasterDataForm] = useState({
  name : ""
});

useEffect(() => {
  if (isUpdate) {
    setMasterDataForm((prev) => {
      return {
        ...prev,
        name: singleRowData?.name ? singleRowData.name : "",
      };
    });
  }
}, [isUpdate, singleRowData]);

const handleCancel = () =>{
  setMasterDataForm((prev) => {
    return {
      name : ""
    }
  })
}

const handleChange = (e, name) => {
  setMasterDataForm((prev) => {
    return {
      ...prev,
      [name]: e.target.value,
    };
  });
};


const handleSubmit = async (e) => {
  e.preventDefault();
  if ("isUpdate") {
    try {
      setError(false);
      setLoading(true);
      await MasterApi.createMasterData(masterDetails?.createData, "rowId", masterDataForm);
      toast.success("Sales Unit Updated Successfully");
    } catch (err) {
      setError(true);
      console.log(err);
    } finally {
      setLoading(false);
      handleCancel();
    }
  } else {
    try {
      setError(false);
      setLoading(true);
      await MasterApi.createMasterData(masterDetails?.createData, masterDataForm) ;
      toast.success(`${masterDetails.name} Master Created Successfully`);
    } catch (err) {
      setError(true);
      console.log(err);
    } finally {
      setLoading(false);
      handleCancel();
    }
  }
};

if(loading){
  return <Loader/>
}

if(error){
  <SomethingWentWrong/>
}


const inputsRow = masterDetails?.label && masterDetails?.label?.map((item, ind) => ({
  inputType: "basic",
  required: true,
  name: item?.name,
  type: "text",
  value: masterDataForm[item.name] ? masterDataForm[item.name] : "",
  labelName: item?.name,
  width: "23rem",
}));

  return (
    <main className="common__layout__wrapper">
      <section className="common__layout__section">
        <form onSubmit={handleSubmit}>
          <section className="currency__container">
            <div className="currency__header">
              <h1> {masterDetails.name} </h1>
            </div>
            <div className="currency__inputsSection">
              {masterDetails?.label?.length > 0 ? <SharedInputs
                inputData={inputsRow}
                handleChange={handleChange}
                
              /> : <Loader/>}
              
            </div>
          </section>

          <div className="common__layout__btn">
            <div className="common__layout__btn__section">
              <button
                className="common__layout__btn1"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="common__layout__btn2"
                type="submit"
                // disabled={!submit}
                // style={{
                //   opacity: submit ? "1" : "",
                //   cursor: submit ? "pointer" : "not-allowed",
                // }}
              >
                {/* {isUpdate ? "Update" : "Create"} */}
                Create
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}

export default MastersDataSub
