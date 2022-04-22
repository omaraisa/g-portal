import { useState, useRef, useEffect,useContext } from "react";
import Editor from '@arcgis/core/widgets/Editor'
import { AppContext } from "../../pages";

let EditorWidget;
export default function EditorComponent({view,sendBackWidget}) {
  const editorRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    EditorWidget =new Editor()
    EditorWidget.view = view;
    EditorWidget.container = editorRef.current;
    EditorWidget.render()
    sendBackWidget({editor:EditorWidget})
  },[]);

  return (
    <div style={styles.container} ref={editorRef}></div>
  );
}
