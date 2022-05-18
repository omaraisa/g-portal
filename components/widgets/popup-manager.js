import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import * as GIS from "../../modules/gis-module";

export default function PopupManager() {
  const { map, layers, targetLayers, updateTargetLayers, sendMessage } =
    useContext(AppContext);
  const [popupSwitchRef, layerSelectorRef] = [useRef(), useRef()];
  const [state, setState] = useState({
    fieldsNames: [],
    layersPopup: [],
    targetLayer: {},
    currentPopup: {
      fieldInfos: [],
    },
  });

  useEffect(() => {
    const targetLayer = targetLayers.popupTargetLayer;
    if (targetLayer) {
      try {
        const fieldsNames = targetLayer.fields.map((field) => field.name);
        const previousLayerPopup = { ...state.currentPopup };
        state.layersPopup.find(
          (popupInfo) => popupInfo.layerID === targetLayer.id
        )
          ? setTargetLayer(targetLayer, fieldsNames, previousLayerPopup, state)
          : addNewPopupInfo(
              targetLayer,
              fieldsNames,
              previousLayerPopup,
              state
            );
        layerSelectorRef.current.value = targetLayer.id;
      } catch (error) {
        sendErrorMessage(
          "عفواً حدث خطأ أثناء معالجة معلومات الطبقة، الرجاء المحاولة مرة أخرى"
        );
        console.log(error);
      }
    }
  }, [targetLayers.popupTargetLayer]);

  function getUpdatedLayersPopup(previousLayerPopup, state) {
    const currentLayersIDs = layers.map((layer) => layer.id);
    const layersPopup = state.layersPopup.map((popup) => {
      if (popup.layerID === state.targetLayer.id)
        popup = { ...previousLayerPopup };
      return popup;
    });
    return layersPopup.filter((popup) =>
      currentLayersIDs.includes(popup.layerID)
    );
  }

  function setTargetLayer(targetLayer, fieldsNames, previousLayerPopup, state) {
    const layersPopup = getUpdatedLayersPopup(previousLayerPopup, state);
    const currentPopup = state.layersPopup.find(
      (popup) => popup.layerID === targetLayer.id
    );
    popupSwitchRef.current.checked = currentPopup.visible;
    setState({
      ...state,
      fieldsNames,
      layersPopup,
      currentPopup,
      targetLayer,
    });
  }

  function addNewPopupInfo(
    targetLayer,
    fieldsNames,
    previousLayerPopup,
    state
  ) {
    const fieldInfos = fieldsNames.map((field) => ({
      fieldName: field,
      visible: true,
    }));

    const popupTemplate = {
      // title: "الحرم رقم {ObjectID}",
      content: [
        {
          type: "fields",
          fieldInfos,
        },
      ],
    };
    popupSwitchRef.current.checked = false;
    targetLayer.popupTemplate = { ...popupTemplate };
    targetLayer.popupEnabled = false;
    const newLayerPopup = {
      layerID: targetLayer.id,
      visible: false,
      fieldInfos,
    };
    const updatedLayersPopup = getUpdatedLayersPopup(previousLayerPopup, state);
    const layersPopup = [...updatedLayersPopup, newLayerPopup];
    setState({
      ...state,
      targetLayer,
      fieldsNames,
      layersPopup,
      currentPopup: { ...newLayerPopup },
    });
  }

  function updatePopup(status, state) {
    state.targetLayer.popupEnabled = status;
    setState({
      ...state,
      currentPopup: { ...state.currentPopup, visible: status },
    });
  }

  function updateFieldVisibility(fieldName, status, state) {
    const newFieldInfos = status
      ? [...state.currentPopup.fieldInfos, { fieldName, visible: true }]
      : state.currentPopup.fieldInfos.filter(
          (field) => field.fieldName !== fieldName
        );

    const newPopupTemplate = state.targetLayer.popupTemplate;
    newPopupTemplate.content[0].fieldInfos = [...newFieldInfos];

    const fieldInfos = state.currentPopup.fieldInfos.map((field) => {
      if (field.fieldName === fieldName) field.visible = status;
      return field;
    });
    setState({
      ...state,
      currentPopup: { ...state.currentPopup, fieldInfos },
    });
  }
  // useEffect(() => console.log(state), [state]);

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "النوافذ المنبثقة",
      body: errorMessage,
    });
  }

  return (
    <div className="flex-column-container">
      <h3>النوافذ المنبثقة Popup</h3>

      <div
        className="flex-column-container"
        style={{ border: "solid 1px #e7e7e7", padding: "1rem" }}
      >
        <label htmlFor="targetLayer">اختر الطبقة</label>
        <select
          id="targetLayer"
          className="select"
          ref={layerSelectorRef}
          onChange={(event) =>
            updateTargetLayers({
              popupTargetLayer: map.findLayerById(event.target.value),
            })
          }
        >
          <option value="" hidden>
            اختر
          </option>
          {layers.map((layer) => {
            if (GIS.supportedLayerTypes.includes(layer.type)) {
              return (
                <option key={layer.id} value={layer.id}>
                  {layer.title}
                </option>
              );
            }
          })}
        </select>

        <div className="flex-row-container">
          <input
            type="checkbox"
            id="popupSwitch"
            ref={popupSwitchRef}
            defaultChecked={false}
            className="switch-input"
            onChange={(event) => updatePopup(event.target.checked, state)}
          />
          <label htmlFor="popupSwitch" className="switch-lable"></label>
          <label htmlFor="popupSwitch">إظهار النافذة المنبثقة</label>
        </div>

        {state.currentPopup.visible && (
          <div className="flex-column-container">
            <b>الحقول</b>
            {state.currentPopup.fieldInfos.map((field) => {
              return (
                <div key={field.fieldName} className="flex-row-container">
                  <input
                    type="checkbox"
                    checked={field.visible}
                    className="checkbox"
                    id={field.fieldName}
                    onChange={(event) =>
                      updateFieldVisibility(
                        field.fieldName,
                        event.target.checked,
                        state
                      )
                    }
                  ></input>
                  <label className="tick-label" htmlFor={field.fieldName}>
                    <div id="tick_mark"></div>
                  </label>
                  <label htmlFor={field.fieldName}>{field.fieldName}</label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
