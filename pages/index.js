import React, { Suspense } from "react";
import Head from "next/head";
import Header from "../components/header";
import MainMenu from "../components/main-menu";
import SubMenu from "../components/sub-menu";
import Loading from "../components/sub_components/loading";
import MessagesContainer from "../components/messages-container";
import { defaultLayout, LayoutManager } from "../components/layout-management";
import {
  updateMessageStatus,
  msgExpirationChecker,
  attachMessage,
} from "../components/messages-manager";
import MinimizeMenu from "../components/sub_components/minimize-menu";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import "react-reflex/styles.css";
import { useState, useEffect, useRef, useReducer, } from "react";
import BottomPane from "../components/bottom-pane";
const MainMap = React.lazy(() => import("../components/main-map"));

export const AppContext = React.createContext();

export default function Home() {
  const [messagesDone, setMessagesDone] = useState(true);
  const [messages, setMessages] = useState({});
  const messagesStateRef = useRef();
  messagesStateRef.current = messages;
  const sendMessage = (message) => {
    setMessagesDone(false);
    setMessages(attachMessage(message, messages));
  };

  const appInitials = {
    layout: defaultLayout,
    map: null,
    view: null,
    layers: [],
    widgets: {},
    targetLayers: {},
    mapDefinition:{
      layerSources: [],      
    },
  };
  
  function reducer(state, action) {
    switch (action.type) {
      case "sendBackMapView":
        const map = action.map;
        const view = action.view;
        if (Object.keys(map).length) return { ...state, map, view };
        return state;
        
        case "sendBackWidget":
          const widget = action.widget;
          if (Object.keys(widget).length) {
            const widgets = { ...state.widgets, ...widget };
            return { ...state, widgets };
          }
        return state;

      case "goToSubMenu":
      case "changeLayout":
      case "goToPreSubMenu":
      case "goToPreBottomPane":
      case "goToBottomPane":
        case "resizeMenu":
          case "toggleMenus":
            const LayoutResponse = LayoutManager(state, action);
            if (LayoutResponse.type === "error") {
              sendMessage(LayoutResponse);
              return state;
            } else return LayoutResponse;
            
            case "updateLayers":
              const layers = action.layers;
              return { ...state, layers };

            case "updateLayerSources":
              const layerSources = action.layerSources;
              return { ...state, mapDefinition:{...state.mapDefinition,layerSources} };

      case "updateTargetLayers":
        const targetLayers = {...state.targetLayers,...action.layer}
        return {...state,targetLayers}

      case "expandPane":
        return action.newState;

        default:
        sendMessage({
          type: "error",
          title: "إجراء خاطئ",
          body: "لم يتم العثور على الإجراء المطلوب",
        });
        return state;
    }
  }
  const [state, dispatch] = useReducer(reducer, appInitials);
  const goToSubMenu = (targetComponent) =>dispatch({ type: "goToSubMenu", targetComponent })
  const goToBottomPane = (targetComponent) =>dispatch({ type: "goToBottomPane", targetComponent })
  const updateLayers = (layers) =>dispatch({ type: "updateLayers", layers })
  const updateLayerSources = (layerSources) =>dispatch({ type: "updateLayerSources", layerSources })
  const updateTargetLayers = (layer) =>dispatch({ type: "updateTargetLayers", layer})
  const sendBackMapView= (map, view) =>dispatch({ type: "sendBackMapView", map, view })

  useEffect(() => {
    const allMessagesCleared = msgExpirationChecker(messagesStateRef)
      ? true
      : false;
    setMessagesDone(allMessagesCleared);
  }, [messages]);


  /*********************************************/
  // useEffect(() => console.log(state),[state])


  return (
    <AppContext.Provider value={{...state,sendMessage,goToSubMenu,goToBottomPane,updateLayers,updateLayerSources,updateTargetLayers,sendBackMapView}}>
    <div className="app" content={"abc"}>
      <Head>
        <title>جي بورتال | نسخة تجريبية</title>
        <meta name="description" content="منصة جي بورتال" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Header
        activeSubMenu={state.layout.subMenuCurrentComponent}
        goTo={(targetComponent) =>
          dispatch({ type: "goToSubMenu", targetComponent })
        }
      />
      <main>
        <ReflexContainer
          orientation="vertical"
          style={{ flexDirection: "row-reverse" }}
        >
          <ReflexElement
            className="left-pane"
            style={{
              transition: state.layout.animationOn ? "0.5s ease-in" : "none",
            }}
            onStopResize={(event) =>
              dispatch({
                type: "changeLayout",
                event,
                targetPaneFlex: "leftPaneFlex",
              })
            }
            flex={state.layout.leftPaneFlex}
            maxSize={state.layout.leftPaneMaxSize}
            minSize={state.layout.leftPaneMinSize}
          >
            <SubMenu
              currentComponent={state.layout.subMenuCurrentComponent}
              {...state}
              goBack={(previousComponent) =>
                dispatch({ type: "goToPreSubMenu", previousComponent })
              }
              addWidget={(widgetName) =>
                dispatch({ type: "addWidget", widgetName })
              }
              sendBackWidget={(widget) =>
                dispatch({ type: "sendBackWidget", widget })
              }
            />
          </ReflexElement>

          <ReflexSplitter
          className="vertical-reflex-spilitter"
            onStartResize={() =>
              dispatch({ type: "resizeMenu", dragStatus: "start" })
            }
            onStopResize={() =>
              dispatch({ type: "resizeMenu", dragStatus: "end" })
            }
          >
            <MinimizeMenu
            vertical={true}
              Onducked={(event) =>
                dispatch({ type: "toggleMenus", event, side: "left" })
              }
              arrow={state.layout.leftPaneArrow}
            />
          </ReflexSplitter>
          <ReflexElement 
          flex={state.layout.middlePaneFlex}
          style={{transition: state.layout.animationOn ? "0.5s ease-in" : "none",}}>
          <ReflexContainer
          orientation="horizontal"
          >
          <ReflexElement
            className="map-pane"
            flex={state.layout.mapPaneFlex}
            style={{
              transition: state.layout.animationOn ? "0.5s ease-in" : "none",
            }}
          >
            <Suspense fallback={<Loading />}>
              <MainMap />
            </Suspense>
            {!messagesDone && (
              <MessagesContainer
                messages={messages}
                updateMessageStatus={(id) =>
                  updateMessageStatus(id, messagesStateRef, setMessages)
                }
              />
            )}
          </ReflexElement>
          <ReflexSplitter
          className="horizontal-reflex-spilitter"
            onStartResize={(event) =>
              dispatch({ type: "resizeMenu", dragStatus: "start" })
            }
            onStopResize={(event) =>
              dispatch({ type: "resizeMenu", dragStatus: "end" })
            }
          >
            <MinimizeMenu
          vertical={false}
              Onducked={(event) =>
                dispatch({ type: "toggleMenus", event, side: "bottom" })
              }
              arrow={state.layout.bottomPaneArrow}
            />
          </ReflexSplitter>
          <ReflexElement
            className="bottom-pane"
            flex={state.layout.bottomPaneFlex}
            style={{
              transition: state.layout.animationOn ? "0.5s ease-in" : "none",
            }}
            maxSize={state.layout.bottomPaneMaxSize}
            minSize={state.layout.bottomPaneMinSize}
          >
             <BottomPane
              currentComponent={state.layout.bottomPaneCurrentComponent}
              {...state}
              goBack={(previousComponent) =>
                dispatch({ type: "goToPreBottomPane", previousComponent })
              }
              addWidget={(widgetName) =>
                dispatch({ type: "addWidget", widgetName })
              }
              sendBackWidget={(widget) =>
                dispatch({ type: "sendBackWidget", widget })
              }
            />

          </ReflexElement>
          </ReflexContainer>
          </ReflexElement>
          <ReflexSplitter
          className="vertical-reflex-spilitter"
            onStartResize={(event) =>
              dispatch({ type: "resizeMenu", dragStatus: "start" })
            }
            onStopResize={(event) =>
              dispatch({ type: "resizeMenu", dragStatus: "end" })
            }
          >
            <MinimizeMenu
            vertical={true}
              Onducked={(event) =>
                dispatch({ type: "toggleMenus", event, side: "right" })
              }
              arrow={state.layout.rightPaneArrow}
            />
          </ReflexSplitter>

          <ReflexElement
            className="right-pane"
            style={{
              transition: state.layout.animationOn ? "0.5s ease-in" : "none",
            }}
            onStopResize={(event) =>
              dispatch({
                type: "changeLayout",
                event,
                targetPaneFlex: "rightPaneFlex",
              })
            }
            flex={state.layout.rightPaneFlex}
            maxSize={state.layout.rightPaneMaxSize}
            minSize={state.layout.rightPaneMinSize}
          >
            <MainMenu
             
              sendBackWidget={(widget) =>
                dispatch({ type: "sendBackWidget", widget })
              }
              goToSubMenu = {(targetComponent) => {dispatch({type:"goToSubMenu",targetComponent})}}
            />
          </ReflexElement>
        </ReflexContainer>
      </main>
    </div>
    </AppContext.Provider>
  );
}
