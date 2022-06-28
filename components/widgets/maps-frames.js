import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import styles from "./maps-frames.module.css";
import Map from "@arcgis/core/Map";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import * as GIS from "../../modules/gis-module";

const initialId = 1001;
const initialMapFrames = [
  {
    name: "الخريطة الافتراضية",
    map: null,
    extent: null,
    id: initialId,
  },
];

export default function MapFrames() {
  const {
    view,
    map,
    widgets,
    sendMessage,
    sendBackMapView,
    layers,
    updateLayers,
  } = useContext(AppContext);
  const [state, setState] = useState({
    activeMapFrameID: initialId,
    deletionTargetID: null,
    additionDivVisible: false,
    mapFrames: initialMapFrames,
    mapFramesInitiated: false,
    layersListVisible: true,
    readyToCopyLayers: [],
  });
  const [mapFrameName, mapFramesList] = [useRef(), useRef()];
  useEffect(() => {
    if (!state.mapFramesInitiated && view) {
      const updatedMapFrames = [...state.mapFrames];
      updatedMapFrames[0].map = map;
      updatedMapFrames[0].extent = view.extent;
      setState({
        ...state,
        mapFrames: updatedMapFrames,
        mapFramesInitiated: true,
      });
    }
  }, [view]);

  function initiateMapFrame(state) {
    setState({ ...state, additionDivVisible: !state.additionDivVisible });
  }

  function addMapFrame(state) {
    try {
      if (!mapFrameName.current.value) {
        sendMessage({
          type: "error",
          title: "إضافة خريطة",
          body: "الرجاء ادخال البيانات بشكل صحيح",
        });
        return;
      }
      const previousMapFrameID = state.activeMapFrameID;
      const previousExtent = view.extent;
      const newMap = new Map({
        basemap: "osm",
      });
      view.map = newMap;
      newMap.allLayers.on("change", () => {
        const layers = [...newMap.layers.items];
        updateLayers(layers);
      });
      sendBackMapView(newMap, view);
      const newMapFrame = {
        name: mapFrameName.current.value,
        map: newMap,
        extent: previousExtent,
        id: Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999),
      };
      const updatedMapFrames = updateMapFrameExtent(
        previousMapFrameID,
        previousExtent,
        state
      );
      const newMapFrames = [...updatedMapFrames, newMapFrame];
      setState({
        ...state,
        activeMapFrameID: newMapFrame.id,
        mapFrames: newMapFrames,
        additionDivVisible: false,
      });
    } catch (error) {
      console.log(error);
      sendErrorMessage(
        "حدث خطأ أثناء محاولة إضافة خريطة جديدة، الرجاء المحاولة مرة أخرى"
      );
    }
  }

  function setActiveMapFrame(id, state) {
    const previousMapFrameID = state.activeMapFrameID;
    const previousExtent = view.extent;
    const selectedMap = state.mapFrames.find(
      (mapFrame) => mapFrame.id === id
    ).map;
    const selectedMaplayers = [...selectedMap.layers.items];
    updateLayers(selectedMaplayers);
    changeMapFrame(state.mapFrames, id);
    const updatedMapFrames = updateMapFrameExtent(
      previousMapFrameID,
      previousExtent,
      state
    );
    setState({
      ...state,
      mapFrames: updatedMapFrames,
      activeMapFrameID: id,
      readyToCopyLayers: [],
    });
  }

  function deleteMapFrame(id, state) {
    setState({ ...state, deletionTargetID: id });
  }

  function cancelMapDeletion(state) {
    setState({ ...state, deletionTargetID: null });
  }

  function confirmMapFrameDeletion(state) {
    const newMapFrames = state.mapFrames.filter(
      (mapFrame) => mapFrame.id !== state.deletionTargetID
    );
    if (!newMapFrames.length) {
      const newMap = new Map({
        basemap: "osm",
      });
      view.map = newMap;
      sendBackMapView(newMap, view);
      const newFrame = {
        name: "خريطة جديدة",
        map: newMap,
        id: Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999),
      };
      newMapFrames.push(newFrame);
    }

    const activeMapFrameID =
      state.activeMapFrameID === state.deletionTargetID
        ? newMapFrames[0].id
        : state.activeMapFrameID;

    changeMapFrame(newMapFrames, activeMapFrameID);
    const selectedMap = newMapFrames.find(
      (mapFrame) => mapFrame.id === activeMapFrameID
    ).map;
    const selectedMaplayers = [...selectedMap.layers.items];
    updateLayers(selectedMaplayers);

    setState({
      ...state,
      activeMapFrameID,
      mapFrames: newMapFrames,
      deletionTargetID: null,
    });
  }

  function changeMapFrame(mapFrames, id) {
    const activeMapFrame = mapFrames.find((mapFrame) => mapFrame.id === id);
    const activeMap = activeMapFrame.map;
    view.map = activeMap;
    view.extent = activeMapFrame.extent;
    sendBackMapView(activeMap, view);
  }

  function updateMapFrameExtent(previousMapFrameID, previousExtent, state) {
    const updatedMapFrames = state.mapFrames.map((mapFrame) => {
      if (mapFrame.id === previousMapFrameID) mapFrame.extent = previousExtent;
      return mapFrame;
    });
    return updatedMapFrames;
  }

  function toggleLayersList(state) {
    setState({ ...state, layersListVisible: !state.layersListVisible });
  }

  function switchLayerExportStatus(event, layerId, state) {
    const readyToCopyLayers = event.target.checked
      ? [...state.readyToCopyLayers.filter((id) => id !== layerId), layerId]
      : state.readyToCopyLayers.filter((id) => id !== layerId);
    setState({ ...state, readyToCopyLayers });
  }

  function copyLayers(state) {
    if (!mapFramesList.current.value || !state.readyToCopyLayers.length) {
      sendErrorMessage(
        "الرجاء التأكد من تحديد الطبقات والخريطة المراد التصدير اليها"
      );
      return;
    }
    try {
      const targetMapFrameId = Number(mapFramesList.current.value);
      const targetMap = state.mapFrames.find(
        (mapFrame) => mapFrame.id === targetMapFrameId
      ).map;
      state.readyToCopyLayers.forEach((layerId) => {
        const targetLayer = map.findLayerById(layerId);
        const newLayer = targetLayer.url
          ? targetLayer.clone()
          : cloneLayerBySource(targetLayer);

        targetMap.add(newLayer);
        widgets["legend"].layerInfos.push({
          layer: newLayer,
        });
      });
      setActiveMapFrame(targetMapFrameId, state);
    } catch (error) {
      sendErrorMessage("عفواً بعض الطبقات المحددة لا يمكن نسخها");
      console.log(error);
    }
  }

  async function cloneLayerBySource(layer) {
    const layerSource = await extractData(layer);
    return generateLayer(layerSource);
  }

  async function extractData(layer) {
    const layerSource = {
      id: layer.id,
      title: layer.title,
      renderer: layer.renderer,
      geometryType: layer.geometryType,
      popupEnabled: layer.popupEnabled,
      popupTemplate: layer.popupTemplate,
      opacity: layer.opacity,
      fields: layer.fields,
      visible: layer.visible,
      legendEnabled: layer.legendEnabled,
      labelsVisible: layer.labelsVisible,
      labelingInfo: layer.labelingInfo,
      type: layer.type,
    };
    layerSource.layerFeatures = await prepareLayerFeatures(layer);
    layerSource.sourceIncluded = true;
    return layerSource;
  }

  function generateLayer(layerSource) {
    const source = layerSource.layerFeatures
    const newLayer = new FeatureLayer({
      title: layerSource.title,
      renderer: layerSource.renderer,
      opacity: layerSource.opacity,
      visible: layerSource.visible,
      geometryType: layerSource.geometryType,
      legendEnabled: layerSource.legendEnabled,
      source: source,
    });
    handleFields(newLayer, layerSource);
    handlePopupTemplates(newLayer, layerSource);
    handleLabelingInfo(newLayer, layerSource);
    return newLayer;
  }

  async function prepareLayerFeatures(layer) {
    return new Promise((resolve, reject) => {
      layer.type === "graphics" ? handleGraphicsLayer() : handleFeatureLayer();

      function handleGraphicsLayer() {
        resolve(layer.graphics.items);
      }
      function handleFeatureLayer() {
        layer.queryFeatures(GIS.allDataQuery).then(function (result) {
          if (result.features.length) {
            const layerFeatures = result.features.map((feature) => {
              const graphic = new Graphic({
                geometry: feature.geometry,
                attributes: feature.attributes,
              });
              return graphic;
            });
            resolve(layerFeatures);
          } else reject([]);
        });
      }
    }).catch((error) => {
      console.log(error);
      return [];
    });
  }

  function handleFields(newLayer, layerSource) {
    try {
      if (layerSource.fields) {
        newLayer.fields = layerSource.fields
        if (!newLayer.fields.some((field) => field.type === "oid")) {
          newLayer.fields.unshift({
            name: "ObjectID",
            type: "oid",
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  function handlePopupTemplates(newLayer, layerSource) {
    try {
      if (layerSource.popupTemplate) {
        newLayer.popupTemplate = layerSource.popupTemplate
        newLayer.popupEnabled = layerSource.popupEnabled;
      }
    } catch (error) {
      console.log(error);
    }
  }

  function handleLabelingInfo(newLayer, layerSource) {
    try {
      if (layerSource.labelingInfo) {
        newLayer.labelingInfo = layerSource.labelingInfo
        newLayer.labelsVisible = layerSource.labelsVisible;
      }
    } catch (error) {
      console.log(error);
    }
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في ادارة الخرائط",
      body: errorMessage,
    });
  }

  // useEffect((_) => console.log(state), [state]);

  return (
    <div className={`flex-column-container`}>
      <button
        className="button primaryBtn"
        onClick={() => initiateMapFrame(state)}
      >
        إنشاء خريطة جديدة
      </button>
      {state.additionDivVisible && (
        <div
          className={`flex-column-container`}
          style={{ padding: "1rem", background: "rgb(228, 248, 223)" }}
        >
          <label htmlFor="textInput" className="textInput">
            <input
              type="text"
              className="input-text"
              id="textInput"
              placeholder="&nbsp;"
              ref={mapFrameName}
            ></input>
            <span className="label">اسم الخريطة</span>
            <span className="focus-bg"></span>
          </label>
          <button
            className="button successBtn"
            onClick={() => addMapFrame(state)}
          >
            إضافة الخريطة
          </button>
        </div>
      )}
      {state.deletionTargetID && (
        <div
          className={`flex-column-container`}
          style={{ padding: "1rem", background: "rgb(248, 223, 223)" }}
        >
          <span>هل أنت متأكد من حذف :</span>
          <b>
            {
              state.mapFrames.find(
                (mapFrame) => mapFrame.id === state.deletionTargetID
              ).name
            }
          </b>
          <button
            className="button dangerBtn"
            onClick={() => confirmMapFrameDeletion(state)}
          >
            نعم
          </button>
          <button
            className="button secondaryBtn"
            onClick={() => cancelMapDeletion(state)}
          >
            لا
          </button>
        </div>
      )}

      {state.mapFrames.map((mapFrame) => {
        return (
          <div
            key={mapFrame.id}
            className={
              state.activeMapFrameID === mapFrame.id
                ? `${styles.mapFrameContainer} ${styles.activeMapFrame} `
                : `${styles.mapFrameContainer} `
            }
          >
            <span
              onClick={() => setActiveMapFrame(mapFrame.id, state)}
              style={{ flex: "1" }}
            >
              {mapFrame.name}
            </span>
            <i
              className={`esri-icon-close-circled ${styles.deleteBtn}`}
              onClick={() => deleteMapFrame(mapFrame.id, state)}
            ></i>
          </div>
        );
      })}

      <div
        className={`flex-row-container`}
        style={{ cursor: "pointer" }}
        onClick={() => toggleLayersList(state)}
      >
        <i className="esri-icon-layer-list main-menu-icon"></i>
        <b>قائمة الطبقات</b>
      </div>

      {state.layersListVisible && (
        <div className={`flex-column-container`}>
          <div className={`flex-row-container`}>
            <button
              className="button secondaryBtn"
              onClick={() => copyLayers(state)}
              style={{ minWidth: "3rem" }}
            >
              نسخ الى
            </button>
            <select ref={mapFramesList} id="mapFramesList" className="select">
              <option value="" hidden>
                اختر
              </option>
              {state.mapFrames.map((mapFrame) => {
                return (
                  <option key={mapFrame.id} value={mapFrame.id}>
                    {mapFrame.name}
                  </option>
                );
              })}
            </select>
          </div>
          {layers.length ? (
            layers.map((layer, index) => {
              return (
                <div
                  key={layer.id}
                  className={`flex-row-container`}
                  style={{ padding: "1rem", background: "#e9e9e9" }}
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    id={layer.id}
                    onChange={(event) =>
                      switchLayerExportStatus(event, layer.id, state)
                    }
                  ></input>
                  <label className="tick-label" htmlFor={layer.id}>
                    <div id="tick_mark"></div>
                  </label>
                  <label htmlFor={layer.id}>{layer.title}</label>
                </div>
              );
            })
          ) : (
            <span>لا توجد طبقات في هذه الخريطة</span>
          )}
        </div>
      )}
    </div>
  );
}
