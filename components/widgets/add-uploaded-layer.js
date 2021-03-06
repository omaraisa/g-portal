import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import styles from "../sub_components/loading.module.css";
import uploadedLayersHandler, {
  allowedExtensions,
  maximumAllowedSize,
} from "../../modules/uploaded-layers-handler";
import { FileUploader } from "react-drag-drop-files";

export default function AddUploadedLayer() {
  const defaultState = {
    layerInfo: {
      fileName: null,
      fileType: null,
      uploadName: null,
      XYColumns: null,
      xfield: null,
      yfield: null,
    },
    urlDisabled: false,
    addLayerBtnDisabled: true,
    loadingLayer: false,
    XYFormVisible: false,
  };
  const [XFieldRef, YFieldRef,uploadBtn] = [
    useRef(),
    useRef(),
    useRef(),
  ];
  const [fileSelected, setFileSelected] = useState(null);
  const [state, setState] = useState(defaultState);
  const appContext = useContext(AppContext);
  const { sendMessage } = appContext;

  function uploadLayer({ state, xField, yField }) {
    const params = {
      layerInfo: { ...state.layerInfo, xField, yField },
      fileSelected,
      appContext,
      toggleXYForm,
      loading,
      cleanup,
      goBack,
    };
    uploadedLayersHandler(params);
  }

  const addUploadedLayer = async () => {
    loading(true);
    try {
      uploadLayer({ state });
    } catch (error) {
      sendMessage({
        type: "error",
        title: "رفع طبقة",
        body: `عفواً، فشلت عملية الرفع الرجاء المحاولة مرة أخرى`,
      });
      console.log(error);
    }
  };

  const loading = (status) => {
    setState({
      ...state,
      loadingLayer: status,
      urlDisabled: status,
      addLayerBtnDisabled: status,
    });
  };

  const cleanup = () => {
    setState({
      ...state,
      layerInfo: {
        ...state.layerInfo,
        fileName: null,
        fileType: null,
        uploadName: null,
      },
      XYFormVisible: false,
      urlDisabled: false,
      addLayerBtnDisabled: true,
    });
  };

  const fileIsValid = (layer, extension) => {
    const maximumSize = maximumAllowedSize[extension];
    const requirements = [
      {
        condition: allowedExtensions.includes(extension),
        errorMessage: "عفواً، الملف المرفوع ليس من ضمن الصيغ المتاحة",
      },
      {
        condition: layer.size <= maximumSize,
        errorMessage: `عفواً، أقصى حجم مسموح به هو ${
          maximumSize / 1000000
        } ميقابايت`,
      },
    ];

    const error = requirements.find((requirement) => !requirement.condition);
    return error ? error : { condition: true };
  };

  const layerChecker = (layer) => {
    if (layer) {
      let uploadName = "";
      const fileName = layer.name.replace(/\..+$/, "");
      const extension = layer.name.split(".").pop();
      const validationResponse = fileIsValid(layer, extension);
      validationResponse.condition
        ? prepareFile()
        : sendErrorMessage(validationResponse.errorMessage);

      function prepareFile() {
        uploadName =
          Math.floor(new Date().getTime()) +
          Math.floor(Math.random() * 999) +
          "." +
          extension;
        setFileSelected(layer);
      }

      function sendErrorMessage(errorMessage) {
        sendMessage({
          type: "error",
          title: "رفع طبقة",
          body: errorMessage,
        });
      }

      setState({
        ...state,
        addLayerBtnDisabled: false,
        layerInfo: {
          ...state.layerInfo,
          fileName,
          uploadName,
          fileType: extension,
        },
      });
    }
  };

  function goBack() {
    XFieldRef.current.length = 0;
    YFieldRef.current.length = 0;
    setState({
      ...state,
      layerInfo: { ...state.layerInfo, fileName: null },
      XYFormVisible: false,
    });
  }

  function toggleXYForm(fieldsNames,XYFeatures) {
    setState({
      ...state,
      layerInfo: {
        ...state.layerInfo,
        XYColumns: fieldsNames,
        fileType: "preparedLayer",
        XYFeatures
      },
      XYFormVisible: true,
    });
    addfieldsNamesToSelectors(fieldsNames);
  }

  function addfieldsNamesToSelectors(fieldsNames) {
    fieldsNames.forEach((field, index) => {
      const option = document.createElement("option");
      option.value = field;
      option.text = field;
      const optionClone = option.cloneNode(true);
      XFieldRef.current.add(option);
      YFieldRef.current.add(optionClone);
      const lowerCaseField = field.toLowerCase();
      if (
        lowerCaseField === "easting" ||
        lowerCaseField === "long" ||
        lowerCaseField === "lon" ||
        lowerCaseField === "x" ||
        lowerCaseField === "longitude"
      )
        XFieldRef.current.options[index + 1].selected = true;

      if (
        lowerCaseField === "northing" ||
        lowerCaseField === "lat" ||
        lowerCaseField === "y" ||
        lowerCaseField === "latitude"
      )
        YFieldRef.current.options[index + 1].selected = true;
    });
  }

   
  useEffect(() => {
    const keyDownHandler = event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        uploadBtn.current.click()
      }
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, []);


  if (!state.XYFormVisible) {
    return (
      <div className="flex-column-container">
        <h3>رفع طبقة </h3>
        <span>
          xls, xlsx, txt, csv, json, geojson, kml, kmz, gpx, zipped Shapefile
        </span>
        {state.layerInfo.fileName && (
          <span>
            <b>{`${state.layerInfo.fileName}.${state.layerInfo.fileType}`}</b>
          </span>
        )}
       
        <FileUploader
          handleChange={layerChecker}
          name="file"
          types={allowedExtensions}
          multiple={false}
          label="اضغط أو ألقي الملف"
          fileOrFiles={fileSelected}
          // eslint-disable-next-line react/no-children-prop
          children={
            <div className="drag-drop-zone">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="33"
            viewBox="0 0 20 17"
          >
            <path fill="#2f80ed" d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z" />
          </svg>
          <span> اضغط أو ألقي الملف&hellip;</span>
        </div>
          }
        />        

        <button
          className="button primaryBtn"
          disabled={state.addLayerBtnDisabled}
          ref={uploadBtn}
          onClick={() => addUploadedLayer()}
        >
          رفع الطبقة
        </button>

        {state.loadingLayer && (
          <div className={styles.loadingDiv} style={{ height: "3rem" }}>
            <i
              className={`esri-icon-loading-indicator  ${styles.loadingIcon}`}
            ></i>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="flex-column-container">
        <i
          className="fas fa-arrow-circle-right backBtn"
          onClick={(state) => goBack(state)}
        ></i>
        <label htmlFor="xField">اختر حقل خط الطول X</label>
        <select id="xField" className="select" ref={XFieldRef}>
          <option value="" hidden>
            اختر
          </option>
        </select>
        <label htmlFor="yField">اختر حقل خط العرض Y</label>
        <select id="yField" className="select" ref={YFieldRef}>
          <option value="" hidden>
            اختر
          </option>
        </select>
        <button
          className="button primaryBtn"
          disabled={state.addLayerBtnDisabled}
          onClick={() =>
            uploadLayer({
              state,
              xField: XFieldRef.current.value,
              yField: YFieldRef.current.value,
            })
          }
        >
          إضافة الطبقة
        </button>
        {state.loadingLayer && (
          <div className={styles.loadingDiv} style={{ height: "3rem" }}>
            <i
              className={`esri-icon-loading-indicator  ${styles.loadingIcon}`}
            ></i>
          </div>
        )}
      </div>
    );
  }
}
