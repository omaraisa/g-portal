import styles from "./sub-menu.module.css";
import Pane from "./widgets/pane";
import Pane2 from "./widgets/pane2";
import Pane3 from "./widgets/pane3";
import AddScratchLayer from "./widgets/add-scratch-layer";
import AddMapService from "./widgets/add-map-service";
import AddCSVLayer from "./widgets/add-csv-layer";
import AddKMLLayer from "./widgets/add-kml-layer";
import AddGeoJSONLayer from "./widgets/add-geojson-layer";
import AddUploadedLayer from "./widgets/add-uploaded-layer";
import Bookmarks from "./widgets/bookmarks";
import GPortalInfo from "./widgets/gportal-info";
// import Print from "../components/widgets/print";
import HTML_ELEMENTS_TEMPLATES from "./HTML_ELEMENTS_TEMPLATES";
import React, { Suspense } from "react";
import Loading from "./sub_components/loading";
const Print = React.lazy(() => import('./widgets/print'))
const Editor = React.lazy(() => import('./widgets/editor'))
const Basemap = React.lazy(() => import('./widgets/basemap'))
const SelectFeatures = React.lazy(() => import('./widgets/select-features'))
const Query = React.lazy(() => import('./widgets/query'))
const IntersectionAnalysis = React.lazy(() => import('./widgets/intersection-analysis'))
const UnionAnalysis = React.lazy(() => import('./widgets/union-analysis'))
const BufferAnalysis = React.lazy(() => import('./widgets/buffer-analysis'))
const MergeAnalysis = React.lazy(() => import('./widgets/merge-analysis'))
const NearAnalysis = React.lazy(() => import('./widgets/near-analysis'))
const ClipAnalysis = React.lazy(() => import('./widgets/clip-analysis'))
const MeasureArea = React.lazy(() => import('./widgets/measure-area'))
const MeasureDistance = React.lazy(() => import('./widgets/measure-distance'))
const CoordinateConversion = React.lazy(() => import('./widgets/coordinate-conversion'))
const LabelManager = React.lazy(() => import('./widgets/label-manager'))
const PopupManager = React.lazy(() => import('./widgets/popup-manager'))
const SymbologyManager = React.lazy(() => import('./widgets/symbology-manager'))
const SaveMap = React.lazy(() => import('./widgets/save-map'))
const OpenMap = React.lazy(() => import('./widgets/open-map'))


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
  SelectFeatures:SelectFeatures,
  Query:Query,
  IntersectionAnalysis:IntersectionAnalysis,
  UnionAnalysis:UnionAnalysis,
  BufferAnalysis:BufferAnalysis,
  MergeAnalysis:MergeAnalysis,
  NearAnalysis:NearAnalysis,
  ClipAnalysis:ClipAnalysis,
  MeasureArea:MeasureArea,
  MeasureDistance:MeasureDistance,
  CoordinateConversion:CoordinateConversion,
  LabelManager:LabelManager,
  PopupManager:PopupManager,
  SymbologyManager:SymbologyManager,
  SaveMap:SaveMap,
  OpenMap:OpenMap,
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
