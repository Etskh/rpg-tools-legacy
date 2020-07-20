import './index.less';
import Menu from './Renderer';
import Renderer from './Menu';
import {
    createApp,
} from './Core';
import {
    tileListener,
} from './Tiles';


const app = createApp('app');

app.addListener(tileListener);

// const isEditMode = false; 
// if(isEditMode) {
app.addChild(Menu);
// }
app.addChild(Renderer);

setTimeout(() => {
    app.dispatch({
        type: 'READY',
    });
}, 10);