import { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import styles from "./main-map.module.css";

let map,view
export default function MainMap({
  sendMessage,
  sendBackMapView,
}) {
  const mapRef = useRef();
  useEffect(() => {
    map = new Map({ 
      basemap: "topo-vector"
    });
    view = new MapView({
      zoom:3,
      center: [0,0],
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
        //console.log("Map and View are ready");
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
