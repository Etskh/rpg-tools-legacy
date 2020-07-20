
export function generateGuid() {
    return `ref:${(Math.random()*1000000).toString(16)}${Date.now().toString(16)}`;
}


export function createElement({
    id,
    children,
    text,
    // Additional methods
    methods,
    // Event listeners
    onClick,
    onMouseMove,
    // HTML
    tag,
    style,
    // Lifecycle
    listens,
    onUpdate,
    onPostRender,
    store,
    dispatch,
}) {
    // create the domNode
    const _children = [];
    const elemId = id ? id : generateGuid();
    const dom = document.createElement(tag ? tag : 'div');
    dom.id = elemId;

    // If we already have children, attach those
    if(children) {
        children.forEach(childFactory => {
            if(!childFactory) {
                return;
            }
            const child = typeof childFactory === 'function'
                ? childFactory(store, dispatch)
                : childFactory;
            _children.push(child);
            dom.appendChild(child.dom);
        });
    }
	
    // If there's text, add a text node
    if(text) {
        dom.appendChild(document.createTextNode(text));
    }

    // Add click event if we have one
    if(onClick) {
        dom.addEventListener('click', (ev) => {
            onClick(ev);
        });
    }
    if(onMouseMove) {
        dom.addEventListener('mousemove', (ev) => {
            onMouseMove(ev);
        });
    }

    if(style) {
        Object.keys(style).forEach(field => {
            dom.style[field] = style[field];
        });
    }

    // THis is our own wrapper around it
    return {
        id: id ? id : generateGuid(),
        dom,
        listens,
        onPostRender,
        onUpdate: onUpdate || (() => {
            // empty
        }),
        // methods
        hide: () => {
            dom.style.display = 'none';
        },
        show: () => {
            dom.style.display = 'block';
        },
        ...(methods ? methods(dom): {}),
    };
}

export function createApp() {
    const rootElem = document.getElementById('root');
    const appElem = document.createElement('div');
    appElem.className = 'app';
    rootElem.appendChild(appElem);

    const children = [];
    let _storeState = {};
    const store = {
        get: (name) => {
            return _storeState[name];
        },
    };

    const _listeners = [];
    const addListener = (listener) => {
        _listeners.push(listener);
    };

    const dispatch = (action) => {
		
        // If there's no update, simply go through the listeners
        if(action.noUpdate) {
            // During a no-update event, we won't update anyone, but new events can be fired
            const queue = [];
            _listeners.reduce((newState, listener) => {
                return listener(action, newState, (newAction) => {
                    queue.push(newAction);
                });
            }, _storeState);
            return queue.forEach(dispatch);
        }

        // 
        console.log('Dispatched, ', action);

        // Set the new state from the event
        const newStoreState = _listeners.reduce((newState, listener) => {
            const changedState = listener(action, newState, dispatch);
            if(!changedState) {
                return newState;
            }
            return changedState;
        }, _storeState);
        _storeState = newStoreState;
		
        // Now iterate over children, telling them to update
        children.forEach(child => {
            // TODO: only update a child that opts in the change in state
            child.onUpdate(action);
        });
    };

    return {
        children,
        store,
        dispatch,
        addListener,
        addChild: (childFactory) => {
            // if it's null and not a function
            if(!childFactory) { 
                return;
            }
            const child = childFactory(store, dispatch);
            children.push(child);
            appElem.appendChild(child.dom);
            if(child.onPostRender) {
                child.onPostRender({
                    target: child.dom,
                });
            }
            dispatch({
                type: 'ADDED_CHILD',
                child,
            });
        },
    };
}


export const Component = (props) => {
    // return (store, dispatch) => {
    if(Array.isArray(props)) {
        return createElement({
            children: props,
            // store,
            // dispatch,
        });
    }

    return createElement({
        ...props,
        // store,
        // dispatch,
    });
    // }
};



export function Button(title, onClick, props) {
    // return (store, dispatch) => {
    return createElement({
        tag: 'button',
        text: title,
        onClick,
        // store,
        // dispatch,
        ...props,
        methods: (dom) => ({
            setText: (newText) => {
                dom.innerText = newText;
            },
        }),
    });
    // };
}


export function Title(title, props) {
    // return (store, dispatch) => {
    return createElement({
        tag: 'h2',
        text: title,
        // store,
        // dispatch,
        ...props,
        methods: (dom) => ({
            setText: (newText) => {
                dom.innerText = newText;
            },
        }),
    });
    // }
}
export function Text(text, props) {
    return createElement({
        tag: 'p',
        text,
        ...props,
        methods: (dom) => ({
            setText: (newText) => {
                dom.innerText = newText;
            },
        }),
    });
}