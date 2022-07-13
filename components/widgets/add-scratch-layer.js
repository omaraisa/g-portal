import React, { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import ScratchLayerField from "../sub_components/scratch-layer-field";

export default function AddScratchLayer() {
  const defaultState = {
    layerName: "",
    layerType: "",
    fields: [],
  };
  const [state, setState] = useState(defaultState);
  const [layerNameRef ,layerTypeRef ,numberOfFieldsRef] = [useRef(),useRef(),useRef()]
  const { view, map, sendMessage, widgets } = useContext(AppContext);
  const addScratchLayer = () => {
    if (inputChecker()) {
      const scratchLayerFieldsList = [
        {
          name: "ObjectID",
          alias: "ObjectID",
          type: "oid",
        },
      ];
      if(numberOfFieldsRef) 
      state.fields.forEach(({fieldName,fieldType}) =>scratchLayerFieldsList.push({name: fieldName,type: fieldType,}))
      
      const scratchLayer = new FeatureLayer({
        title: state.layerName,
        source: [],
        fields: scratchLayerFieldsList,
        spatialReference: view.spatialReference,
        geometryType: state.layerType,
        popupEnabled: true,
        popupTemplate: {
          title: `العنصر رقم {ObjectID}`,
          content: [{
              type: "fields",
              fieldInfos: scratchLayerFieldsList
          }]
      }
      });
      
        map.add(scratchLayer)
        scratchLayer.when(() => {
          widgets["legend"].layerInfos.push({
            layer: scratchLayer,
          });
        })
      sendMessage({
        type: "info",
        title: "إضافة طبقة",
        body: `تم إضافة الطبقة ${state.layerName} إلى الخريطة بنجاح`,
      });
      
      numberOfFieldsRef.current.value=0;  
      setState(defaultState);
    } else {
      sendMessage({
        type: "error",
        title: "إضافة طبقة",
        body: `الرجاء إدخال جميع البيانات بشكل صحيح`,
      });
    }
  };

  const updateFieldInfo = ({ id, fieldName, fieldType }) => {
    const newFields = state.fields.map((field) => {
      if (field.id === id) {
        field.fieldName = fieldName;
        field.fieldType = fieldType;
      }
      return field;
    });
  };
  const deleteField = (id) => {
    const newFields = state.fields.filter((field) => field.id !== id);
    setState({ ...state, fields: newFields });
  };

  const handleFieldsNoChange = () => {
    let newFields = []
    const inputNumberOfFields = Number(numberOfFieldsRef.current.value);
    const deltaFieldsNumber = inputNumberOfFields - state.fields.length;
    inputNumberOfFields > state.fields.length?
    newFields = addFields()
    :
    newFields = dropFields()

    function addFields() {
      const tempFields = [];
      for (let i = 0; i < deltaFieldsNumber; i++) {
        const id = Math.floor(new Date().getTime())+Math.floor(Math.random() * 999);
        const newField = {
          id: id,
          fieldName:"",
          fieldType:"",
        };
        tempFields.push(newField);
      }
      return [...state.fields, ...tempFields];
    }

    function dropFields() {
      const tempFields =  [...state.fields]
      tempFields.length = inputNumberOfFields
      return tempFields
    }

    setState({ ...state, fields: newFields });
  };

  const inputChecker = () => {
    if (
      state.layerName &&
      state.layerName !== "" &&
      state.layerType &&
      state.layerType !== ""
    ) {
      if (numberOfFieldsRef)
      {
        return state.fields.every((field) =>
          Object.values(field).every((value) => (value !== null && value !== "") ? true: false ));
      }
      return true;
    }
    return false;
  };

  
  
  useEffect(() => {
    const keyDownHandler = event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addScratchLayer()
      }
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, []);


  return (
    <div className="flex-column-container">
      <h3>إضافة طبقة جديدة</h3>
      <label htmlFor="scratchLayerName" className="textInput">
        <input
          type="text"
          className="input-text"
          id="scratchLayerName"
          ref={layerNameRef}
          onChange={() =>
            setState({ ...state, layerName: layerNameRef.current.value })
          }
        ></input>
        <span className="label">اسم الطبقة</span>
        <span className="focus-bg"></span>
      </label>

      <label htmlFor="scratchLayerType">اختر نوع الطبقة</label>
      <select
        id="scratchLayerType"
        className="select"
        ref={layerTypeRef}
        onChange={() =>
          setState({ ...state, layerType: layerTypeRef.current.value })
        }
      >
        <option value="" hidden>
          اختر
        </option>
        <option value="point">نقاط</option>
        <option value="polyline">خطوط</option>
        <option value="polygon">مضلعات</option>
      </select>

      <label htmlFor="scratchLayerFieldsNo">عدد الحقول</label>
      <input
        type="number"
        className="input-number"
        id="scratchLayerFieldsNo"
        min={0}
        max={10}
        ref={numberOfFieldsRef}
        onChange={() => handleFieldsNoChange()}
      ></input>

      {state.fields.length ? (
        state.fields.map((field) => (
          <ScratchLayerField
            key={field.id}
            id={field.id}
            updateFieldInfo={(fieldState) => updateFieldInfo(fieldState)}
            deleteField={(id) => deleteField(id)}
          />
        ))
      ) : (
        <span>ليس لهذه الطبقة حقول</span>
      )}

      <button className="button primaryBtn" onClick={() => addScratchLayer()}>
        إنشاء الطبقة
      </button>
    </div>
  );
}
