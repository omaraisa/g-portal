import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Sketch from "@arcgis/core/widgets/Sketch";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

let sketchGraphic = new GraphicsLayer({
  title: "طبقة الرسم",
  listMode: "hide",
});

let sketch = new Sketch({
  layer: sketchGraphic,
  availableCreateTools: ["polygon", "rectangle", "circle"],
  creationMode: "single",
  visibleElements : {
    selectionTools:{
      "rectangle-selection":false,
      "lasso-selection": false
    },
    settingsMenu: false
  }
});

export default function SelectFeatures() {
  const { map, view, layers, sendMessage } = useContext(AppContext);
  const [
    targetLayerRef,
    selectionLayerRef,
    sketchContainerRef,
    relationshipRef,
  ] = [useRef(), useRef(), useRef(), useRef()];
  const defaultState = {
    targetLayerView: null,
    selectionLayerView: null,
    selectionResultLayer: null,
    resultFeatures: null,
    interactiveSelectionActive: false,
    sketchInitialized: false,
  };
  const [state, setState] = useState(defaultState);
  const stateRef = useRef();
  stateRef.current = state;

  useEffect(() => {
    if (view && !state.sketchInitialized) {
      sketch.container = sketchContainerRef.current;
      sketch.view = view;
      sketch.on("create", ({ graphic, state }) => {
        if (state === "complete") {
          runQuery({
            geometriesAry: [graphic.geometry],
            spatialRelationship: "intersects",
            state: stateRef.current,
          });
        }
      });
      setState({ ...stateRef.current, sketchInitialized: true });
    }
  }, [state]);

  function toggleInteractiveSelection(state) {
    setState({
      ...state,
      interactiveSelectionActive: !state.interactiveSelectionActive,
    });
  }

  function setTargetLayer(state) {
    const layerIndex = targetLayerRef.current.value;
    const targetLayer = layers[layerIndex];
    view
      .whenLayerView(targetLayer)
      .then((layerView) => setState({ ...state, targetLayerView: layerView }));
  }

  function setSelectionLayer(state) {
    const layerIndex = selectionLayerRef.current.value;
    const selectionLayer = layers[layerIndex];
    view
      .whenLayerView(selectionLayer)
      .then((layerView) =>setState({ ...state, selectionLayerView: layerView }));
  }

  function getQueryResult(geometriesAry, spatialRelationship, state) {
    return geometriesAry.map((geometry) => {
      const query = {
        outFields: ["*"],
        geometry: geometry,
        returnGeometry: true,
        spatialRelationship,
      };
      return state.targetLayerView
        .queryFeatures(query)
        .then((response) => response.features)
        .catch((error) => {
          sendErrorMessage("حدث خطأ أثناء البحث الرجاء المحاولة مرة أخرى");
          console.log("Query Error", error);
          return;
        });
    });
  }

  function runQuery({ geometriesAry, spatialRelationship, state }) {
    const resultFeatures = getQueryResult(
      geometriesAry,
      spatialRelationship,
      state
    );
    
    Promise.all(resultFeatures).then((response) => {
      const resultFeatures = [].concat(...response);

      resultFeatures.length
        ? addQueryResult({ resultFeatures, state: stateRef.current })
        : sendErrorMessage("لا توجد نتيجة لهذا البحث");
    });
  }

  function getUniqueFeatures(allFeatures) {
    const uniqueFeatures = [];
    allFeatures.forEach((feature) => {
      const isDuplicate = uniqueFeatures.some((uniqueFeature) => {
        return geometryEngine.equals(feature.geometry, uniqueFeature.geometry);
      });
      if (!isDuplicate) {
        uniqueFeatures.push(feature);
      }
    });
    return uniqueFeatures;
  }

  function addQueryResult({ resultFeatures, state }) {
    const {title,fields,geometryType,spatialReference,popupTemplate} = state.targetLayerView.layer
    
    if (state.selectionResultLayer) {
      map.remove(state.selectionResultLayer);
      setState({ ...state, selectionResultLayer: null });
    }
    const uniqueFeatures = getUniqueFeatures(resultFeatures);
    const symbols = {
      point: {
        type: "simple-marker",
        style: "circle",
        color: "rgba(0,255,255,1)",
        size: "8px",
      },
      polyline: {
        type: "simple-line",
        color: "rgba(0,255,255,1)",
        width: 3,
      },
      polygon: {
        type: "simple-fill",
        color: "rgba(255,255,255,0)",
        outline: {
          width: 2,
          color: "rgba(0,255,255,1)",
        },
      },
    };
    const querySymbol = symbols[geometryType];

    const renderer = {
      type: "simple",
      symbol: querySymbol,
    };

    const source = uniqueFeatures.map((feature) => {
      const queryGraphic = new Graphic({
        geometry: feature.geometry,
        attributes: feature.attributes,
        symbol: querySymbol,
      });
      // view.graphics.add(queryGraphic)
      return queryGraphic;
    });

    
    if (!fields.some((field) => field.type === "oid")) {
      fields.unshift({
        name: "ObjectID",
        type: "oid",
      });
    }
    const selectionResultLayer = new FeatureLayer({
      title: title + " نتيجة تحديد",
      geometryType: geometryType,
      spatialReference: spatialReference,
      popupTemplate: popupTemplate,
      popupEnabled: true,
      fields,
      renderer,
      source,
    });

    map.layers.add(selectionResultLayer);
    selectionResultLayer.queryExtent().then(function (result) {
      view.goTo(result.extent).then(() => {
        sendMessage({
          type: "info",
          title: "البحث والاستعلام",
          body: `اكتملت عملية البحث على طبقة ${title}`,
        });
        setState({
          ...state,
          selectionResultLayer,
          resultFeatures: uniqueFeatures,
        });
      });
    });
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في عملية التحديد",
      body: errorMessage,
    });
  }

  function startSelection(state) {
    // wait for all layerviews to be generated disable search button
    const spatialRelationship = relationshipRef.current.value;
    const query = {
      outFields: ["*"],
      returnGeometry: true,
      geometry: state.selectionLayerView.layer.fullExtent,
    };

    state.selectionLayerView
      .queryFeatures(query)
      .then(function (response) {
        const geometriesAry = response.features.map(
          (feature) => feature.geometry
        );
        response.features.length
          ? runQuery({ geometriesAry, spatialRelationship, state })
          : sendErrorMessage("لا توجد معالم في هذه الطبقة");
      })
      .catch((error) => {
        sendErrorMessage("حدث خطأ أثناء البحث الرجاء المحاولة مرة أخرى");
        console.log("Query Error", error);
      });
  }

  function stopSelection(state) {
    if (state.selectionResultLayer) {
      map.layers.remove(state.selectionResultLayer);
      setState({ ...state, resultFeatures: null, selectionResultLayer: null });
    }
  }

  async function downloadQueryResult(state) {
    const geometryType = state.selectionResultLayer.geometryType;
    const features = state.resultFeatures.map((feature) => {
      const geometryGetter = {
        point: () => getPointGeom(),
        polygon: () => getPolygonGeom(),
        polyline: () => getlineGeom(),
      };

      function getPointGeom() {
        return feature.geometry.coordinates
          ? {
              coordinates: feature.geometry.coordinates,
              geometry: "MultiPoint",
            }
          : {
              coordinates: [
                feature.geometry.longitude,
                feature.geometry.latitude,
              ],
              geometry: "Point",
            };
      }
      function getPolygonGeom() {
        return {
          coordinates: feature.geometry.rings,
          geometry:
            feature.geometry.rings.length > 1 ? "MultiPolygon" : "Polygon",
        };
      }

      function getlineGeom() {
        return {
          coordinates: feature.geometry.paths,
          geometry:
            feature.geometry.paths.length > 1
              ? "MultiLineString"
              : "LineString",
        };
      }

      return {
        type: "Feature",
        properties: feature.attributes,
        geometry: {
          type: geometryGetter[geometryType]().geometry,
          coordinates: geometryGetter[geometryType]().coordinates,
        },
      };
    });

    const geojsonQueryResult = {
      type: "FeatureCollection",
      features: features,
    };

    const fileName = state.selectionResultLayer.title;
    const geojson = JSON.stringify(geojsonQueryResult);
    const blob = new Blob([geojson], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".geojson";
    link.key =
      Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // useEffect(() => console.log(state), [state]);

  return (
    <div className="flex-column-container">
      <h3>تحديد المعالم Selection</h3>

      <label htmlFor="targetLayerRef">الطبقة المستهدفة</label>
      <select
        ref={targetLayerRef}
        id="targetLayerRef"
        className="select"
        onChange={() => setTargetLayer(state)}
      >
        <option value="" hidden>
          اختر
        </option>
        {layers.map((layer, index) => {
          return (
            <option key={layer.id} value={index}>
              {layer.title}
            </option>
          );
        })}
      </select>

      <div className="flex-row-container">
        <input
          type="checkbox"
          checked={state.interactiveSelectionActive}
          onChange={() => toggleInteractiveSelection(state)}
          className="checkbox"
          id="mapSelectionCheckBock"
        ></input>
        <label className="tick-label" htmlFor="mapSelectionCheckBock">
          <div id="tick_mark"></div>
        </label>
        <label htmlFor="mapSelectionCheckBock">التحديد من الخريطة</label>
      </div>

      <div className="flex-row-container">
        <input
          type="checkbox"
          checked={!state.interactiveSelectionActive}
          onChange={() => toggleInteractiveSelection(state)}
          className="checkbox"
          id="layerSelectionCheckBock"
        ></input>
        <label className="tick-label" htmlFor="layerSelectionCheckBock">
          <div id="tick_mark"></div>
        </label>
        <label htmlFor="layerSelectionCheckBock">التحديد عبر طبقة أخرى</label>
      </div>

      <div
        key="interactiveSelection"
        className="flex-column-container"
        ref={sketchContainerRef}
        style={{
          display: state.interactiveSelectionActive ? "flex" : "none",
        }}
      ></div>

      <div
        key="layerSelection"
        className="flex-column-container"
        style={{
          display: state.interactiveSelectionActive ? "none" : "flex",
        }}
      >
        <label htmlFor="selectionLayerRef">التحديد عبر طبقة أخرى</label>
        <select
          ref={selectionLayerRef}
          id="selectionLayerRef"
          className="select"
          onChange={() => setSelectionLayer(state)}
        >
          <option value="" hidden>
            اختر
          </option>
          {layers.map((layer, index) => {
            return (
              <option key={layer.id} value={index}>
                {layer.title}
              </option>
            );
          })}
        </select>

        <label htmlFor="selectionCondition">شرط التحديد</label>
        <span style={{ fontSize: "1.2rem" }}>
          مثال: الطبقة المستهدفة تحتوي الطبقة الأخرى
        </span>
        <select
          className="select"
          id="selectionCondition"
          ref={relationshipRef}
          defaultValue={"intersects"}
        >
          <option value="intersects">تتقاطع Intersects</option>
          <option value="contains">تحتوي Contains</option>
          <option value="touches">تلامس Touches</option>
          <option value="within">ضمن Within</option>
          <option value="disjoint">تختلف Disjoint</option>
        </select>

        <button
          className="button primaryBtn"
          onClick={() => startSelection(state)}
        >
          <i className="esri-icon-cursor-marquee"></i>
          &nbsp; بدء التحديد
        </button>
      </div>

      <button
        className="button primaryBtn"
        onClick={() => stopSelection(state)}
      >
        <i className="esri-icon-close"></i>
        &nbsp; الغاء التحديد
      </button>
      <button
        className="button successBtn"
        disabled={state.selectionResultLayer ? false : true}
        onClick={() => downloadQueryResult(state)}
      >
        تحميل النتيجة
      </button>
    </div>
  );
}
