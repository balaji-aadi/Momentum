import React, { useEffect, useState } from 'react'
import Loader from '../../components/Loader';
import SectionMainCard from '../../Shared/SectionMainCard';
import { FaListUl, FaPencilAlt } from 'react-icons/fa';
import MastersDataSub from './MastersDataSub';
import { Table } from '../../components/Table/Table';
import { useStoreData } from '../../store/SharedStore';
import BreadCrumb from '../../Shared/BreadCrumb';
import Action from '../../components/Table/Action';
import { MasterApi } from '../../services/api/masterApi';
import { data } from '../demo';

const MastersData = () => {
  const [loading, setLoading] = useState(false);
  const {masterDetails,editHeading} = useStoreData()
  const [error, setError] = useState(false);
  const [route,setRoute] = useState()


  const id = masterDetails?.id

  useEffect(() => {
    (async () => {
      const matchedItem = data.find((item) => item.id === id);
      if (matchedItem) {
        setRoute(matchedItem?.routing?.getAllData);
      }
    })();
  }, [id]);



  const getMasterList = () => {
    return MasterApi.getAllMasterData(route);
  };


  const [columnDefs] = useState([
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => {
        return params.node.rowIndex + 1;
      },
    },
    {
      field: "name",
      enableValue: true,
      cellRenderer: (props) => {
        return props.data?.name;
      },
    },
    {
      headerName: "Actions",
      field: "SNo",
      cellClass: "no-outline",
      cellRenderer: (params) => (
        <Action
          params={params}
          show={false}
          // handleDeleteApi={deleteSalesUnit}
          // setError={setError}
          setLoading={setLoading}
        />
      ),
      minWidth: 150,
    },
  ]);
  
  const [subHeading, setSubHeading] = useState([
    {
      icon: <FaPencilAlt className="subHeading__icon" />,
      headName: "Master Details",
      content: <MastersDataSub  />,
      isActive: true,
    },
    {
      icon: <FaListUl className="subHeading__icon" />,
      headName: `Master Details list`,
      content: (
        <Table
          column={columnDefs}
          searchLabel={"Master"}
          getTableFunction={getMasterList}
        />
      ),
      isActive: false,
    },
  ]);
  
  return (
    <main className="common__container">
    {loading ? (
      <Loader />
    ) : (
      <>
        <BreadCrumb Hname={masterDetails.name} Sname={"Master"} />
        <SectionMainCard
          subSection={subHeading}
          setSubSection={setSubHeading}
        />
      </>
    )}
  </main>
);
}

export default MastersData
