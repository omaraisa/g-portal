export const defaultLayout = {
  leftPaneArrow: "▶",
  leftPaneFlex: 0,
  leftPaneMinSize: 0,
  leftPaneMaxSize: 1,
  leftPaneMinimized: true,
  rightPaneArrow: "▶",
  rightPaneFlex: 0.2,
  rightPaneMinSize: 300,
  rightPaneMaxSize: 500,
  rightPaneMinimized: false,
  middlePaneFlex: 0.8,
  middlePaneMinSize: 600,
  mapPaneFlex:1,
  bottomPaneFlex:0,
  bottomPaneArrow:"▲",
  bottomPaneMaxSize: 1,
  bottomPaneMinimized: true,
  animationOn: false,
  subMenuCurrentComponent: "DefaultPane",
  bottomPaneCurrentComponent: "DefaultPane",
};

export const LayoutManager = (state,action) => {
  switch (action.type) {
    case 'goToSubMenu':
      return goToSubMenu(state, action.targetComponent);
      case 'goToPreSubMenu':
        return goToPreSubMenu(state,action)
        case 'goToBottomPane':
          return goToBottomPane(state, action.targetComponent);
    case 'goToPreBottomPane':
      return goToPreBottomPane(state, action);
    case 'changeLayout':
      return changeLayout(state,action)
    case 'resizeMenu':
      return resizeMenu(state,action)
    case 'toggleMenus':
      return toggleMenus(state,action)
    default:
      return {type:"error", title:"إجراء خاطئ", body:"تعذر تعديل واجهة التطبيق بالشكل الذي تريده"}
     
  }


}

   const updateMenusProps = ([side,newMiddlePaneFlex,paneArrow,paneFlex,paneMinSize,paneMaxSize,paneMinimized,animationOn]) => {
    const updatedMenuProps = {}
    updatedMenuProps[`middlePaneFlex`] = newMiddlePaneFlex
    updatedMenuProps[`${side}PaneArrow`] = paneArrow
    updatedMenuProps[`${side}PaneFlex`] = paneFlex
    updatedMenuProps[`${side}PaneMinSize`] = paneMinSize
    updatedMenuProps[`${side}PaneMaxSize`] = paneMaxSize
    updatedMenuProps[`${side}PaneMinimized`] = paneMinimized
    updatedMenuProps[`animationOn`] = animationOn
    return updatedMenuProps
  }
   const updateMiddlePaneProps = (mapPaneFlex,bottomPaneFlex,bottomPaneMaxSize,bottomPaneArrow,bottomPaneMinimized) => {
    return {mapPaneFlex,bottomPaneFlex,bottomPaneMaxSize,bottomPaneArrow,bottomPaneMinimized}
  }

   const toggleMenus = (state,{side})  =>  {
     const toggleSides = {
       right: () => toogleRightMenu(),
       left: () => toogleLeftMenu(),
       bottom: () => toogleBottomMenu(),
     }
     function toogleRightMenu() {
       const newLayout = state.layout.rightPaneMinimized?
       {...state.layout,...updateMenusProps(["right",(state.layout.middlePaneFlex - 0.2),"▶",0.21,200,500,false,true])}
       :
       {...state.layout,...updateMenusProps(["right",(state.layout.middlePaneFlex + state.layout.rightPaneFlex),"◀",0,0,1,true,true])}
       const newState = {...state,layout:newLayout}
       return newState
      }

     function toogleLeftMenu() {
       const newLayout = state.layout.leftPaneMinimized?
       {...state.layout,...updateMenusProps(["left",(state.layout.middlePaneFlex - 0.2),"◀",0.21,150,500,false,true])}
       :
       {...state.layout,...updateMenusProps(["left",(state.layout.middlePaneFlex + state.layout.leftPaneFlex),"▶",0,0,1,true,true])}
       const newState = {...state,layout:newLayout}
       return newState
      }
      
      function toogleBottomMenu() {
       const newLayout = state.layout.bottomPaneMinimized?
       {...state.layout,...updateMiddlePaneProps(0.6,0.4,2000,"▼",false)}
       :
       {...state.layout,...updateMiddlePaneProps(1,0,1,"▲",true)}
       const newState = {...state,layout:newLayout}
       return newState
      }

      return toggleSides[side]()
   
  }

  
   const changeLayout = (state,{event, targetPaneFlex})   => {
    const newPaneFlex = event.component.props.flex;
    const deltaFlex = newPaneFlex - state.layout[targetPaneFlex];
    const newMiddlePaneFlex = state.layout.middlePaneFlex - deltaFlex;
    let newState = {...state,layout:{...state.layout,middlePaneFlex:newMiddlePaneFlex}} 
    newState.layout[targetPaneFlex] = newPaneFlex;
    return newState
  }
  
   const resizeMenu = (state,{dragStatus})   => {
    if(dragStatus === "start")  
    return {...state,layout:{...state.layout,animationOn:false}};
    if(dragStatus === "end")   
    return {...state,layout:{...state.layout,animationOn:true}};
  }
  
   const goToSubMenu =  (state,targetComponent)  =>  {
    const expandPaneProps = {
          leftPaneArrow: "◀",
          leftPaneFlex: 0.2,
          leftPaneMinSize: 150,
          leftPaneMaxSize: 500,
          leftPaneMinimized: false,
          middlePaneFlex: state.layout.middlePaneFlex - 0.2,
    }
    const minimizePaneProps = {
          leftPaneArrow: "▶",
          leftPaneFlex: 0,
          leftPaneMinSize: 0,
          leftPaneMaxSize: 1,
          leftPaneMinimized: true,
          middlePaneFlex: state.layout.middlePaneFlex + 0.2,
    }

    let newLayout = {...state.layout,subMenuCurrentComponent:targetComponent}
    
    if (state.layout.leftPaneMinimized) 
    newLayout = {...newLayout,...expandPaneProps}

    if (targetComponent === 'DefaultPane') 
    newLayout = {...newLayout,...minimizePaneProps}

    return {...state,layout:newLayout} 

    // return {...state,layout:{...state.layout,subMenuCurrentComponent:targetComponent}} 
  }
  
  const goToPreSubMenu =  (state,{previousComponent})  =>  {
    if(previousComponent)
    return {...state,layout:{...state.layout,subMenuCurrentComponent:previousComponent}}
  }
  
   const goToBottomPane =  (state,targetComponent)  =>  {
     const expandPaneProps = {
      mapPaneFlex:0.6,
      bottomPaneFlex:0.4,
      bottomPaneArrow:"▼",
      bottomPaneMaxSize: 2000,
      bottomPaneMinimized: false,
    }

    let newLayout = {...state.layout,bottomPaneCurrentComponent:targetComponent}
    if (state.layout.bottomPaneMinimized) 
    newLayout = {...newLayout,...expandPaneProps}

    return {...state,layout:newLayout} 
  }
  
   const goToPreBottomPane =  (state,{previousComponent})  =>  {
    return {...state,layout:{...state.layout,bottomPaneCurrentComponent:previousComponent}} 
  }
  
  
  