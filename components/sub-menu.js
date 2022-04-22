import styles from "./sub-menu.module.css";
import Pane from "./submenu_components/pane";
import Pane2 from "./submenu_components/pane2";
import Pane3 from "./submenu_components/pane3";
import AddScratchLayer from "./submenu_components/add-scratch-layer";
import AddMapService from "./submenu_components/add-map-service";
import AddCSVLayer from "./submenu_components/add-csv-layer";
import AddKMLLayer from "./submenu_components/add-kml-layer";
import AddGeoJSONLayer from "./submenu_components/add-geojson-layer";
import AddUploadedLayer from "./submenu_components/add-uploaded-layer";
import Bookmarks from "./submenu_components/bookmarks";
import GPortalInfo from "./submenu_components/gportal-info";
// import Print from "../components/widgets/print";
import HTML_ELEMENTS_TEMPLATES from "./HTML_ELEMENTS_TEMPLATES";
import React, { Suspense } from "react";
import Loading from "./sub_components/loading";
const Print = React.lazy(() => import('./widgets/print'))
const Editor = React.lazy(() => import('./widgets/editor'))
const Basemap = React.lazy(() => import('./widgets/basemap'))

const components = {
  Pane: Pane,
  Pane2: Pane2,
  Pane3: Pane3,
  Print: Print,
  Editor: Editor,
  Basemap: Basemap,
  AddScratchLayer:AddScratchLayer,
  AddMapService:AddMapService,
  AddCSVLayer:AddCSVLayer,
  AddKMLLayer:AddKMLLayer,
  AddGeoJSONLayer:AddGeoJSONLayer,
  AddUploadedLayer:AddUploadedLayer,
  Bookmarks:Bookmarks,
  Pane4: HTML_ELEMENTS_TEMPLATES,
  GPortalInfo:GPortalInfo,
};
const subMenuPreviousComponents = {
  Pane3: "Pane2",
  Pane2: "Pane",
};

export default function SubMenu(props) {
  const CurrentComponent = components[props.currentComponent];
  const previousComponent = subMenuPreviousComponents[props.currentComponent];
  return (
    <div className={styles.submenu}>
      {previousComponent &&
        <i className="fas fa-arrow-circle-right backBtn" onClick={() => props.goBack(previousComponent)}></i>
    }
      
      <Suspense fallback={<Loading />}>
      <CurrentComponent  addWidget={props.addWidget} sendBackWidget={props.sendBackWidget} map={props.map} view={props.view}/>
      </Suspense>
    </div>
  );
}