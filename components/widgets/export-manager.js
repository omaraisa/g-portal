import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import * as GIS from "../../modules/gis-module";
import shpwrite from 'fixed-shp-write'


export default function ExportManager() {
  const { map, layers, targetLayers, sendMessage } =
    useContext(AppContext);
  const [outputTypeRef, layerSelectorRef] = [useRef(), useRef()];
  const [state, setState] = useState({
    targetLayer: {},
    outputType: "shp",
    geojsonFeatures:[],
    exportBtnDisabled: true,
  });
  const stateRef = useRef();
  stateRef.current = state;

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في تصدير البيانات",
      body: errorMessage,
    });
  }

  useEffect(() => {
    const targetLayer = targetLayers.exportingTargetLayer;
    if (targetLayer)
    {
      layerSelectorRef.current.value = targetLayer.id
      prepareData(targetLayer.id, state)
    }
  }, [targetLayers.exportingTargetLayer]);

  function prepareData(layerId, state) {
    const targetLayer = map.findLayerById(layerId);
    targetLayer
      .queryFeatures(GIS.allDataQuery)
      .then(function (result) {
        const geojson = prepareGeoJson(targetLayer, result.features);
        Promise.all([geojson]).then((response) => {
          setState({
            ...state,
            targetLayer,
            geojsonFeatures:response[0],
            exportBtnDisabled: false,
          });
        });
      })
      .catch((error) => {
        sendErrorMessage("تعذر جمع البيانات عن الطبقة المختارة");
        console.log("Export Data Error", error);
      });
    }
    
    function exportData(state) {
      try {
        const fileName = state.targetLayer.title;
      
        const exportFunction = {
        shp : () => exportShapefile(state,fileName),
        geojson : () => exportGeoJson(state,fileName),
      }
      exportFunction[outputTypeRef.current.value]()

      setState({
        ...state,
        targetLayer: {},
        geojsonFeatures: [],
        exportBtnDisabled: true,
      });
      sendMessage({
        type: "info",
        title: "تصدير البيانات",
        body: 'تم تصدير البيانات بنجاح',
      });
      } catch (error) {
        sendErrorMessage("حدث خطأ أثناء تصدير البيانات")
        console.log("Export Data Error", error);
      }
  }

  
  function exportShapefile(state,fileName) {
    const options = {
      folder: fileName,
      types: {
          point: 'mypoints',
          polygon: 'mypolygons',
          line: 'mylines'
        }
      }        
    shpwrite.download(state.geojsonFeatures, options);
  }

  function exportGeoJson(state,fileName) {
    const blob = new Blob([JSON.stringify(state.geojsonFeatures)], { type: "application/json" });
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

  async function prepareGeoJson(targetLayer, features) {
    const geometryType = targetLayer.geometryType;
    const geoJsonFeatures = features.map((feature) => {
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

    return {
      type: "FeatureCollection",
      features: geoJsonFeatures,
    };
  }

  // useEffect(() => console.log(state), [state]);

  return (
    <div className="flex-column-container">
      <h3>تصدير البيانات</h3>

      <label htmlFor="targetLayer">اختر الطبقة</label>
      <select
        id="targetLayer"
        className="select"
        ref={layerSelectorRef}
        onChange={(event) => prepareData(event.target.value, state)}
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

      <label htmlFor="outputType">اختر نوع المخرجات</label>
      <select
        id="outputType"
        className="select"
        ref={outputTypeRef}
        defaultValue="shp"
        onChange={(event) =>
          setState({ ...state, outputType: event.target.value })
        }
      >
        <option value="shp">Shapefile</option>
        <option value="geojson">GeoJson</option>
      </select>

      <button
        className="button successBtn"
        disabled={state.exportBtnDisabled}
        onClick={() => exportData(state)}
      >
        تصدير البيانات
      </button>
    </div>
  );
}
