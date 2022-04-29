import { useEffect, useRef, useContext } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import styles from "./main-map.module.css";
import { AppContext } from "../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
let map,view
export default function MainMap() {
  const { sendMessage, sendBackMapView, updateLayers } = useContext(AppContext);
  const mapRef = useRef();
  useEffect(() => {
    map = new Map({ 
      basemap: "topo-vector"
    });
    view = new MapView({
      zoom:6,
      center: [32,15],
      ui : {
          components : ["zoom","compass"]
      }});
    view.map = map;
    view.container = mapRef.current;
    view
      .when(_ => {
        sendBackMapView(map,view)
      })
      .then((_) => {
        map.allLayers.on("change", () => {
        const layers = [...map.layers.items];
        updateLayers(layers)
        })

        var myLayer = new FeatureLayer({
          url: "https://services6.arcgis.com/nEMEkLg8rZV7Ijyb/ArcGIS/rest/services/SudanMap/FeatureServer/2",
          });
          map.add(myLayer);
        var myLayer1 = new FeatureLayer({
          url: "https://services6.arcgis.com/nEMEkLg8rZV7Ijyb/ArcGIS/rest/services/SudanMap/FeatureServer/1",
          });
          map.add(myLayer1);
        var polygons = new GeoJSONLayer({
          url: "https://mygportalstorage.blob.core.windows.net/layerscontainer/1651077414949.json",
          });
          map.add(polygons);
      })
      .catch((e) =>{
      console.log(e)
        sendMessage({
          type: "error",
          title: "إجراء خاطئ",
          body: "حدث خطأ ما أثناء تحميل الخريطة الرجاء المحاولة مرة أخرى",
        })}
      );
  }, []);

  
  return <div className={styles.map} ref={mapRef}></div>;
}
