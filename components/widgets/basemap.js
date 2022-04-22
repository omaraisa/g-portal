import { useState, useRef, useEffect } from "react";
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery'

let BasemapGalleryWidget;
export default function BasemapGalleryComponent({view,sendBackWidget}) {
  const basemapGalleryRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    BasemapGalleryWidget = new BasemapGallery()
    BasemapGalleryWidget.view = view;
    BasemapGalleryWidget.container = basemapGalleryRef.current;
    BasemapGalleryWidget.render()
    sendBackWidget({basemapGallery:BasemapGalleryWidget})
  },[]);

  return (
    <div style={styles.container} ref={basemapGalleryRef}></div>
  );
}
