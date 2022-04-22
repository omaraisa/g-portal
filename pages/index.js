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
const MainMap = React.lazy(() => import("../components/main-map"));

export const AppContext = React.createContext();

export default function Home() {
  const [messagesDone, setMessagesDone] = useState(true);
  const [messages, setMessages] = useState({});
  const messagesStateRef = useRef();
  messagesStateRef.current = messages;
  const mapRef = useRef();
  const sendMessage = (message) => {
    setMessagesDone(false);
    setMessages(attachMessage(message, messages));
  };

  const appInitials = {
    layout: defaultLayout,
    map: null,
    view: null,
    widgets: {},
  };
  
  function reducer(state, action) {
//     console.log("action ", action.type)
    
//     const sendBackMapView = () => {  
//       const map = action.map;
//       const view = action.view;
//       if (Object.keys(map).length) return { ...state, map, view };
//       return state;
//     }  
    
//     const sendBackWidget = () => {
//  const widget = action.widget;     
//         if (Object.keys(widget).length) {
//           const widgets = { ...state.widgets, ...widget };
//           return { ...state, widgets };
//         }  
//         return state;
//     }    
    
//     const LayoutManagement = () => {
//       const LayoutResponse = LayoutManager(state, action);
//       if (LayoutResponse.type === "error") {
//         sendMessage(LayoutResponse);
//         return state;
//       } else return LayoutResponse;  
//     }  
    
//     const expandLeftMenu = () => {
//       if (Object.entries(action.newState).length) return action.newState;
//       return state;
//     }      
    
//     const showAddLayerWidget = () => {
//       console.log("fired")
//       if(action.targetComponent)
//       return {...state,layout:{...state.layout,subMenuCurrentComponent:action.targetComponent}}
//       return state
//     }  
    
    
    
//     const actionNavigator = {
//       sendBackMapView : sendBackMapView,
//       sendBackWidget : sendBackWidget,
//       goToSubMenu:LayoutManagement,
//       changeLayout:LayoutManagement,
//       goToPreSubMenu:LayoutManagement,
//       resizeMenu:LayoutManagement,
//       toggleMenus:LayoutManagement,
//       expandLeftMenu : expandLeftMenu,
//       showAddLayerWidget : showAddLayerWidget,     
//     }  
    
//     const defaultAction = () => {
//       sendMessage({
//         type: "error",
//         title: "إجراء خاطئ",
//         body: "لم يتم العثور على الإجراء المطلوب",
//       });
//       return state;
//     }

//     actionNavigator[action.type]? actionNavigator[action.type]() : defaultAction()
       
    

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
      case "resizeMenu":
      case "toggleMenus":
        const LayoutResponse = LayoutManager(state, action);
        if (LayoutResponse.type === "error") {
          sendMessage(LayoutResponse);
          return state;
        } else return LayoutResponse;

      case "expandLeftMenu":
        if (Object.entries(action.newState).length) return action.newState;
        return state;

      case 'showAddLayerWidget':
        if(action.targetComponent)
        return {...state,layout:{...state.layout,subMenuCurrentComponent:action.targetComponent}}
        return state

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

  useEffect(() => {
    const allMessagesCleared = msgExpirationChecker(messagesStateRef)
      ? true
      : false;
    setMessagesDone(allMessagesCleared);
  }, [messages]);

  

  useEffect(() => {
    if (Object.entries(state).length) {
      if (state.layout.leftPaneMinimized) {
        const newLayout = {
          ...state.layout,
          leftPaneArrow: "◀",
          leftPaneFlex: 0.2,
          leftPaneMinSize: 150,
          leftPaneMaxSize: 500,
          leftPaneMinimized: false,
          middlePaneFlex: state.layout.middlePaneFlex - 0.2,
        };
        const newState = {
          ...state,
          layout: { ...state.layout, ...newLayout },
        };
        dispatch({ type: "expandLeftMenu", newState });
      }
    }
  }, [state.layout.subMenuCurrentComponent]);

  /******************************************** */
  // useEffect(() => console.log(state),[state])


  return (
    <AppContext.Provider value={{...state,sendMessage,goToSubMenu}}>
    <div className="app" content={"abc"}>
      <Head>
        <title>جي بورتال</title>
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
            onStartResize={() =>
              dispatch({ type: "resizeMenu", dragStatus: "start" })
            }
            onStopResize={() =>
              dispatch({ type: "resizeMenu", dragStatus: "end" })
            }
          >
            <MinimizeMenu
              Onducked={(event) =>
                dispatch({ type: "toggleMenus", event, side: "left" })
              }
              arrow={state.layout.leftPaneArrow}
            />
          </ReflexSplitter>

          <ReflexElement
            className="middle-pane"
            style={{
              transition: state.layout.animationOn ? "0.5s ease-in" : "none",
            }}
            flex={state.layout.middlePaneFlex}
            minSize={state.layout.middlePaneMinSize}
          >
            <Suspense fallback={<Loading />}>
              <MainMap
                {...state}
                sendMessage={(message) => sendMessage(message)}
                sendBackMapView={(map, view) =>
                  dispatch({ type: "sendBackMapView", map, view })
                }
              />
            </Suspense>
            {messagesDone || (
              <MessagesContainer
                messages={messages}
                updateMessageStatus={(id) =>
                  updateMessageStatus(id, messagesStateRef, setMessages)
                }
              />
            )}
          </ReflexElement>

          <ReflexSplitter
            onStartResize={(event) =>
              dispatch({ type: "resizeMenu", dragStatus: "start" })
            }
            onStopResize={(event) =>
              dispatch({ type: "resizeMenu", dragStatus: "end" })
            }
          >
            <MinimizeMenu
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
              showAddLayerWidget = {(targetComponent) => {dispatch({type:"showAddLayerWidget",targetComponent})}}
            />
          </ReflexElement>
        </ReflexContainer>
      </main>
    </div>
    </AppContext.Provider>
  );
}
