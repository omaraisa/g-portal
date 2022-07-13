import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import CSVLayer from "@arcgis/core/layers/CSVLayer";
import styles from "../sub_components/loading.module.css";


export default function AddCSVLayer() {
  const [urlRef, addLayerBtnRef] = [useRef(), useRef()];
  const [state, setState] = useState({
    urlDisabled: false,
    addLayerBtnDisabled:false,
    loadingLayer: false,
  });
  const { map, view, sendMessage, widgets } = useContext(AppContext);

  const addCSVLayer = (url) => {
    const csvLayer = new CSVLayer({
      url: url,
    });
    map.add(csvLayer);
    loadingCheck(csvLayer);
    csvLayer.when(()=> {
      widgets["legend"].layerInfos.push({
        layer: csvLayer,
      });
      const fieldInfos = [];
      csvLayer.fields.forEach(field => {
          const attrField = {
              fieldName: field.name
          }
          fieldInfos.push(attrField);
      })
      const popupTemplate = {
        title: `{ ${csvLayer.fields[0].name} }`,
        content: [{
            type: "fields",
            fieldInfos: fieldInfos
        }]
    }
    csvLayer.popupTemplate = popupTemplate
    view.goTo(csvLayer.fullExtent);
    })
  };

  const loadingCheck = (layer) => {
    const loadChecker = setInterval(() => {
      if(loadingTrigger[layer.loadStatus])
      loadingTrigger[layer.loadStatus]()
    }, 1000);
    
    const layerLoadingAction = (type,title,body) =>{
      sendMessage({
        type: type,
        title: title,
        body: body,
      });
      clearInterval(loadChecker);
      loading(false)
    }

      const loadingTrigger = {
        loaded: ()=>layerLoadingAction("info","إضافة طبقة","تم إضافة الطبقة إلى الخريطة بنجاح"),
        failed: ()=>layerLoadingAction("error","إضافة طبقة","عفواً، فشلت عملية إضافة الطبقة، تحقق من الرابط"),
      }
  
  };

  const loading = (status) => {
    setState({...state,loadingLayer:status,urlDisabled: status,addLayerBtnDisabled: status,})
  }

  const urlChecker = (url) => {
    loading(true)
    if(url.split('.').pop() === "csv")
    {
      fetch(url)
      .then(() => addCSVLayer(url))
      .catch((e) => {
        loading(false)
        sendMessage({
          type: "error",
          title: "إضافة طبقة",
          body: `عفواً، الرابط غير صحيح`,
        });
      });
    }
    else{
      loading(false)
      sendMessage({
        type: "error",
        title: "إضافة طبقة",
        body: `عفواً، الرابط غير صحيح`,
      }); 
    }
  };

  
  useEffect(() => {
    const keyDownHandler = event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        urlChecker(urlRef.current.value)
      }
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, []);


  return (
    <div className="flex-column-container">
      <h3>إضافة طبقة CSV</h3>
      <label htmlFor="serviceUrl">أدخل الرابط</label>
      <input
        className="inputText"
        type="text"
        id="serviceUrl"
        required
        disabled={state.urlDisabled}
        ref={urlRef}
      ></input>

      <button
        className="button primaryBtn"
        ref={addLayerBtnRef}
        disabled={state.addLayerBtnDisabled}
        onClick={() => urlChecker(urlRef.current.value)}
      >
        إضافة الطبقة
      </button>

      {state.loadingLayer && (
        <div className={styles.loadingDiv} style={{height:"3rem"}}>
          <i
            className={`esri-icon-loading-indicator  ${styles.loadingIcon}`}
          ></i>
        </div>
      )}
    </div>
  );
}
