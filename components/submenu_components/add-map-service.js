import { useState, useRef, useContext } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import styles from "../sub_components/loading.module.css";

export default function AddMapService() {
  const [urlRef, layerTypeRef, addLayerBtnRef] = [useRef(), useRef(), useRef()];
  const [state, setState] = useState({
    urlDisabled: true,
    addLayerBtnDisabled: true,
    loadingLayer: false,
  });
  const { map, view, sendMessage, widgets} = useContext(AppContext);

  const addFeatureLayer = () => {
    const featureLayer = new FeatureLayer({
      url: urlRef.current.value,
    });
    map.add(featureLayer);
    loadingCheck(featureLayer);
    featureLayer.when(() => {
      widgets["legend"].layerInfos.push({
        layer: featureLayer,
      });
      const fieldInfos = [];
      featureLayer.fields.forEach((field) => {
        const attrField = {
          fieldName: field.name,
        };
        fieldInfos.push(attrField);
      });
      const popupTemplate = {
        title: `{ ${featureLayer.fields[0].name} }`,
        content: [
          {
            type: "fields",
            fieldInfos: fieldInfos,
          },
        ],
      };
      featureLayer.popupTemplate = popupTemplate;

      view.goTo(featureLayer.fullExtent);
    });
  };

  const addImageryLayer = () => {
    const imageryLayer = new MapImageLayer({
      url: urlRef.current.value,
    });
    map.add(imageryLayer);
    loadingCheck(imageryLayer);
    imageryLayer.when(() => {
      widgets["legend"].layerInfos.push({
        layer: imageryLayer,
      });
      view.goTo(imageryLayer.fullExtent);
    })
  };

  const addMapService = {
    featureService: addFeatureLayer,
    imageService: addImageryLayer,
  };

  const loadingCheck = (layer) => {
    const loadChecker = setInterval(() => {
      if (loadingTrigger[layer.loadStatus]) loadingTrigger[layer.loadStatus]();
    }, 1000);

    const layerLoadingAction = (type, title, body) => {
      sendMessage({
        type: type,
        title: title,
        body: body,
      });
      clearInterval(loadChecker);
      loading(false);
    };

    const loadingTrigger = {
      loaded: () =>
        layerLoadingAction(
          "info",
          "إضافة طبقة",
          "تم إضافة الطبقة إلى الخريطة بنجاح"
        ),
      failed: () =>
        layerLoadingAction(
          "error",
          "إضافة طبقة",
          "عفواً، فشلت عملية إضافة الطبقة، تحقق من الرابط"
        ),
    };
  };

  const urlChecker = () => {
    loading(true);
    fetch(urlRef.current.value)
      .then(() => addMapService[layerTypeRef.current.value]())
      .catch((e) => {
        loading(false);
        sendMessage({
          type: "error",
          title: "إضافة طبقة",
          body: `عفواً، الرابط غير صحيح`,
        });
      });
  };

  const loading = (status) => {
    setState({
      ...state,
      loadingLayer: status,
      urlDisabled: status,
      addLayerBtnDisabled: status,
    });
  };
  return (
    <div className="flex-column-container">
      <h3>إضافة طبقة جديدة</h3>

      <label htmlFor="scratchLayerType">اختر نوع الطبقة</label>
      <select
        id="scratchLayerType"
        className="select"
        required
        ref={layerTypeRef}
        onChange={() => {
          urlRef.current.value = "";
          setState({ ...state, urlDisabled: false });
        }}
      >
        <option value="" hidden>
          اختر
        </option>
        <option value="featureService">Feature Service</option>
        <option value="imageService">Map Service</option>
        <option value="imageService">Image Service</option>
      </select>

      <label htmlFor="serviceUrl">أدخل الرابط</label>
      <input
        className="inputText"
        type="text"
        id="serviceUrl"
        required
        disabled={state.urlDisabled}
        ref={urlRef}
        onChange={() => setState({ ...state, addLayerBtnDisabled: false })}
      ></input>

      <button
        className="button primaryBtn"
        ref={addLayerBtnRef}
        disabled={state.addLayerBtnDisabled}
        onClick={() => urlChecker()}
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
