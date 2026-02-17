import { createContext, useContext, useState } from "react";
import moment from "moment";

export const SharedContext = createContext();

export const useStoreData = () => {
  return useContext(SharedContext);
};

export const SharedContextProvider = ({ children }) => {
  // const [formData, setFormData] = useState([]);
  const [count, setCount] = useState(1);
  const [fields, setFields] = useState([{ id: 0 }]);
  const [editSwitch, setEditSwitch] = useState(false);
  const [editHeading, setEditHeading] = useState(false);
  const [singleRowData, setSingleRowData] = useState();
  const [countryData, setCountryData] = useState([]);
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [priceHistoryRowData, setPriceHistoryRowData] = useState();
  const [singleProductData, setSingleProductData] = useState();
  const [masterDetails, setMasterDetails] = useState([]);

  const masterFunc = (data) => {
    setMasterDetails(data);
  };

  const [isUpdate, setIsUpdate] = useState(
    singleRowData === undefined && false
  );

  const singleRowDataFunction = (data) => {
    setSingleRowData(data);
    setPriceHistoryRowData(data);
    setIsUpdate(true);
  };

  const fetchingCountryList = async () => {
    try {
      // const res = await currencyApi.getCountryList();
      // setCountryData(res.data);
    } catch (err) {
      console.log(err);
      console.log(err);
    }
  };

  const countryOptions = countryData.map((country, ind) => {
    return {
      value: country.id,
      label: country.name,
    };
  });

  // ** Create material section data starts here ** //

  const [images, setImages] = useState([]);
  const [isImage, setIsImage] = useState(false);
  const [docImages, setdocImages] = useState([]);
  const [isDocImage, setIsDocImage] = useState(false);
  const [isProductUpdate, setIsProductUpdate] = useState(false);
  const [updatedId, setUpdatedId] = useState();

  const [materialForm, setMaterialForm] = useState({
    // [main]
    product_number: "",
    product_name: "",
    product_type: "",
    part_no: "",
    product_code: "",
    old_product_code: "",
    material_description: "",
    storage_type: "",
    tracking_group: "",
    item_valutaion: "",
    cost_centers: "",
    inventory_uom: "",
    inventory_conversion_qty: "",
    sales_uom: "",
    sales_uom_conversion: "",
    purchase_uom: "",
    purchase_uom_conversion: "",
    product_color: "",
    procurement: false,
    service: false,
    active: false,
    dg_indicator: false,
    quality_check: false,
    product_block: false,
    qr_code_indicatior: false,
    product_category: "",
    product_subcategory: "",
    product_group: "",
    gross_wt: "",
    net_wt: "",
    volume: "",
    vendor_product_code: "",
    shelf_days: "",

    // [material_packing]

    material_packing: "",
    material: "",
    packing_type: "",
    packing_cost: "",
    packing_time: "",
    packing_quality: "",
    packing_group: "",
    packing_net_wt: "",
    packing_gross_wt: "",
    packing_material: "",
    packing_controller: "",
    packing_bom: "",
    packing_quality_check: false,
    packing_label: false,
    packing_warehouse: "",

    // [material_attachment]

    material_ref_link: "",
    doc: "",

    // [pricing_history]

    currency: "",
    sale_pricing: null,
    purchase_pricing: null,
    avg_cost: null,
    standard_cost: null,
    production_pricing: null,
    pricing_version: null,
    sample_pricing: null,
    mrp_pricing: null,
    online_pricing: null,
    service_pricing: null,
    pricing_active: false,
    manual_pricing: false,
    contract_pricing: false,
    pricing_block: false,
    valid_date_from: moment.utc(new Date()).format("YYYY-MM-DD"),

    // [points]

    no_of_points: "",
    cls_code_1: "",
    cls_code_2: "",
    sub_cls_code_1: "",
    sub_cls_code_2: "",
    size_code: "",
    tp_mapped_no: "",
    tp_principal_id: "",
    hns_code: "",
    wherehouse: "",
    applicable_date: "",

    // [tax]

    tax: "",
    tax_applicable_date: moment.utc(new Date()).format("YYYY-MM-DD"),
    taxName: "",
    taxHnscCode: "",

    // [alias]

    alias: "",
  });
  const [materialAliasRowData, setMaterialAliasRowData] = useState({
    counter: 0,
    rowData: [],
    payloadData: [],
  });

  const [materialPricingRowData, setMaterialPricingRowData] = useState({
    counter: 0,
    rowData: [],
    payloadData: [],
  });

  const [materialTaxRowData, setMaterialTaxRowData] = useState({
    counter: 0,
    rowData: [],
    payloadData: [],
  });

  //  ** Create material section data ends here **//

  // ** Purchase section data starts here ** //

  const [form, setForm] = useState({
    supplierName: "",
    supplierType: "",
    supplierCompanyName: "",
    companyDescription: "",
    alias: "",
    email: "",
    phone: "",
    reference: "",
    supplierGroup: "",
    currency: "",
    invoice: "",
    website: "",
    id: "",
    country: "",
    state: "",
    default: null,
    addressType: "",
    postalCode: "",
    address: "",
    address1: "",
    landMark: "",
    addressEmail: "",
    addressPhone: "",
    addressCountry: "",
    addressState: "",
    addressCity: "",
    registrationID: "",
    registrationType: "",
    registrationPartyType: "",
    deliveryTerms: "",
    modeofDelivery: "",
    firstName: [],
    lastName: [],
    contactType: [],
    supplierEmail: [],
    supplierContact: [],
    supplierContactdefault: [],
    segments: [],
    creditLimit: [],
    creditPeriod: [],
    bankKey: [],
    accountHolderName: [],
    accountNumber: [],
    bankName: [],
    bankType: [],
    branch: [],
    iban: [],
    ifsc: [],
    swiftCode: [],
  });

  const [exchangeRatePayload, setExchangeRatePayload] = useState({
    country: "",
    currency: "",
    exchange_currency: [],
    exchange_rate: [],
    applicable_date: [],
  });

  const [addressTableData, setAddressTableData] = useState({
    default: null,
    addressType: "",
    postalCode: "",
    address: "",
    address1: "",
    landMark: "",
    addressEmail: "",
    addressPhone: "",
    addressCountry: "",
    addressState: "",
    addressCity: "",
    registrationID: "",
    registrationType: "",
    registrationPartyType: "",
    deliveryTerms: "",
    modeofDelivery: "",
  });

  const handleAddressReset = () => {
    setForm((prev) => {
      return {
        ...prev,
        default: false,
        addressType: "",
        postalCode: "",
        address: "",
        address1: "",
        landMark: "",
        addressEmail: "",
        addressPhone: "",
        addressCountry: "",
        addressState: "",
        addressCity: "",
        registrationID: "",
        registrationType: "",
        registrationPartyType: "",
        deliveryTerms: "",
        modeofDelivery: "",
      };
    });
  };

  const SupplierhandleChange = (e, name, index) => {
    setForm((prev) => {
      const updateData = [...prev[name]];

      updateData[index] = e.target.value;
      return {
        ...prev,
        [name]: updateData,
      };
    });
  };

  const SupplierhandleSelect = (e, name, index) => {
    setForm((prev) => {
      const updateData = [...prev[name]];
      updateData[index] = e.value;
      return {
        ...prev,
        [name]: updateData,
      };
    });
  };

  const handleChange = (e, name) => {
    setForm((prev) => {
      return {
        ...prev,
        [name]: e.target.value,
      };
    });
    setAddressTableData((prev) => {
      return {
        ...prev,
        [name]: e.target.value,
      };
    });
  };

  const handleChecked = (event, name) => {
    if (event.target.checked) {
      setAddressTableData((prev) => {
        return {
          ...prev,
          [name]: true,
        };
      });
      setForm((prev) => {
        return {
          ...prev,
          [name]: true,
        };
      });
    } else {
      setAddressTableData((prev) => {
        return {
          ...prev,
          [name]: false,
        };
      });
      setForm((prev) => {
        return {
          ...prev,
          [name]: false,
        };
      });
    }
  };

  const handleSelect = (e, name) => {
    setForm((prev) => {
      return {
        ...prev,
        [name]: e.value,
      };
    });

    setAddressTableData((prev) => {
      return {
        ...prev,
        [name]: e.label,
      };
    });
  };

  //  ** Purchase section data ends here **//

  // const handleForm = (nameType, form) => {
  //   setFormData((prevData) => ({
  //     ...prevData,
  //     [nameType]: form,
  //   }));
  // };

  // const handleSectionChange = (index, newData, sections, setSections) => {
  //   const updatedSections = sections.map((section, i) =>
  //     i === index
  //       ? { ...section, data: { ...section.data, ...newData } }
  //       : section
  //   );
  //   setSections(updatedSections);
  // };

  return (
    <SharedContext.Provider
      value={{
        // handleForm,
        // formData,
        handleChange,
        handleSelect,
        form,
        addressTableData,
        setForm,
        setAddressTableData,
        handleChecked,
        handleAddressReset,
        // handleSectionChange,
        SupplierhandleChange,
        count,
        setCount,
        fields,
        setFields,
        SupplierhandleSelect,
        editSwitch,
        setEditSwitch,
        editHeading,
        setEditHeading,
        exchangeRatePayload,
        setExchangeRatePayload,
        singleRowData,
        singleRowDataFunction,
        isUpdate,
        setIsUpdate,
        countryOptions,
        fetchingCountryList,
        materialForm,
        setMaterialForm,
        setMaterialPricingRowData,
        materialPricingRowData,
        setMaterialTaxRowData,
        materialTaxRowData,
        materialAliasRowData,
        setMaterialAliasRowData,
        setImages,
        images,
        setIsImage,
        isImage,
        docImages,
        setdocImages,
        isDocImage,
        setIsDocImage,
        openDeactivateModal,
        setOpenDeactivateModal,
        priceHistoryRowData,
        setPriceHistoryRowData,
        singleProductData,
        setSingleProductData,
        updatedId,
        setUpdatedId,
        isProductUpdate,
        setIsProductUpdate,
        masterDetails,
        setMasterDetails,
        masterFunc,
      }}
    >
      {children}
    </SharedContext.Provider>
  );
};
