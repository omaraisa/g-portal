import { useEffect, useRef, useContext } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import styles from "./main-map.module.css";
import { AppContext } from "../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import CSVLayer from "@arcgis/core/layers/CSVLayer";
import esriConfig from "@arcgis/core/config";
import dotenv from 'dotenv'
dotenv.config();
const ArcGISAPIKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;

let map,view
export default function MainMap() {
  const { sendMessage, sendBackMapView, updateLayers } = useContext(AppContext);
  const mapRef = useRef();
  useEffect(() => {
    esriConfig.apiKey =ArcGISAPIKey

    map = new Map({ 
      basemap: "arcgis-topographic"
    });
    view = new MapView({
      zoom:3,
      center: [15,0],
      ui : {
          components : ["zoom"]
      }});
    view.map = map;
    view.container = mapRef.current;
    view
      .when(_ => {
        sendBackMapView(map,view)
      })
      .then((_) => {
        map.allLayers.on("change", () => {
        const layers = map.layers.items.filter(layer=> layer.type !== "graphics");
        updateLayers(layers)
        })
        // var myLayer = new FeatureLayer({
        //   url: "https://services6.arcgis.com/nEMEkLg8rZV7Ijyb/ArcGIS/rest/services/SudanMap/FeatureServer/2",
        //   });
        //   map.add(myLayer);
        // var myLayer1 = new FeatureLayer({
        //   url: "https://services6.arcgis.com/nEMEkLg8rZV7Ijyb/ArcGIS/rest/services/SudanMap/FeatureServer/1",
        //   });
        //   map.add(myLayer1);
        // var polygons = new GeoJSONLayer({
        //   url: "https://mygportalstorage.blob.core.windows.net/layerscontainer/1651077414949.json",
        //   });
        //   // map.add(polygons);
        // var earthquake = new CSVLayer({
        //   url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.csv",
        //   });
        //   // map.add(earthquake);
          
      })
      .catch((e) =>{
      console.log(e)
        sendMessage({
          type: "error",
          title: "?????????? ????????",
          body: "?????? ?????? ???? ?????????? ?????????? ?????????????? ???????????? ???????????????? ?????? ????????",
        })}
      );
  }, []);

  
  return <div className={styles.map} ref={mapRef}></div>;
}
