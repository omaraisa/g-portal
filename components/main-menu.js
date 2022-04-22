import React, { Suspense } from 'react';
import styles from './main-menu.module.css'
import Accordion from 'react-bootstrap/Accordion'
import Loading from "./sub_components/loading";
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
const LegendComponent = React.lazy(() => import('./widgets/legend'))
const LayerListComponent = React.lazy(() => import('./widgets/layerlist'))

export default function MainMenu(props) {
  return (
    <div className={styles.mainmenu}>
      
      <Accordion >
  <Accordion.Item eventKey="0">
    <Accordion.Header>
    <i className="esri-icon-layer-list main-menu-icon" ></i>  
      <h5>قائمة الطبقات</h5>
      </Accordion.Header>
    <Accordion.Body>
    <Suspense fallback={<Loading />}>
          <LayerListComponent sendBackWidget={props.sendBackWidget}/>
          </Suspense>
    </Accordion.Body>
  </Accordion.Item>

  <Accordion.Item eventKey="1">
    <Accordion.Header>
    <i className="esri-icon-legend main-menu-icon" ></i> 
    <h5>مفتاح الخريطة</h5></Accordion.Header>
    <Accordion.Body>
    <Suspense fallback={<Loading />}>
          <LegendComponent view={props.view} sendMessage={(message) =>sendMessage(message)} sendBackWidget={props.sendBackWidget}/>
          </Suspense>
    </Accordion.Body>
  </Accordion.Item>
  
  <Accordion.Item eventKey="2">
    <Accordion.Header>
    <i className="esri-icon-add-attachment main-menu-icon" ></i> 
    <h5>إضافة طبقة</h5></Accordion.Header>
    <Accordion.Body>
      <div className='flex-column-container'>
      <button onClick={()=>props.showAddLayerWidget("AddScratchLayer")} className="button secondaryBtn leftBtn">Scratch Layer <i className="esri-icon-sketch-rectangle" ></i></button>
      <button onClick={()=>props.showAddLayerWidget("AddMapService")} className="button secondaryBtn leftBtn">Web Service <i className="esri-icon-layers" ></i></button>
      <button onClick={()=>props.showAddLayerWidget("AddCSVLayer")} className="button secondaryBtn leftBtn">CSV Layer <i className="esri-icon-map-pin" ></i></button>
      <button onClick={()=>props.showAddLayerWidget("AddKMLLayer")} className="button secondaryBtn leftBtn">KML Layer <i className="esri-icon-maps" ></i></button>
      <button onClick={()=>props.showAddLayerWidget("AddGeoJSONLayer")} className="button secondaryBtn leftBtn">GeoJson Layer <i className="esri-icon-table" ></i></button>
      <button onClick={()=>props.showAddLayerWidget("AddUploadedLayer")} className="button secondaryBtn leftBtn">Upload Layer <i className="esri-icon-upload" ></i></button>
      </div>
    </Accordion.Body>
  </Accordion.Item>
  
  <Accordion.Item eventKey="3">
    <Accordion.Header>
    <i className="esri-icon-search main-menu-icon" ></i> 
    <h5>بحث</h5></Accordion.Header>
    <Accordion.Body>
      Lorem  
    </Accordion.Body>
  </Accordion.Item>
  
  <Accordion.Item eventKey="4">
    <Accordion.Header>
    <i className="esri-icon-line-chart main-menu-icon" ></i> 
    <h5>تحليل البيانات</h5></Accordion.Header>
    <Accordion.Body>
      Lorem  
    </Accordion.Body>
  </Accordion.Item>
  
  <Accordion.Item eventKey="5">
    <Accordion.Header>
    <i className="esri-icon-settings2 main-menu-icon" ></i> 
    <h5>أدوات الخريطة</h5></Accordion.Header>
    <Accordion.Body>
      Lorem  
    </Accordion.Body>
  </Accordion.Item>
  
  <Accordion.Item eventKey="6">
    <Accordion.Header>
    <i className="esri-icon-collection main-menu-icon" ></i> 
    <h5>قائمة الخرائط</h5></Accordion.Header>
    <Accordion.Body>
      Lorem  
    </Accordion.Body>
  </Accordion.Item>
  

</Accordion>

    </div>
  )
}
