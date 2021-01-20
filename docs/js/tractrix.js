const cnv = document.getElementById('c'),  
    ctx = cnv.getContext('2d'),
    //fourBar = g2(),
    world = g2().clr()
                .view({cartesian: true, x: 0, y: 0})
                //.use({grp: fourBar})
                .nod({x:100, y:100})
                .grid({color: "grey", size: 20});
                //.lin({x1:0,y1:-mec.ursprung.y,x2:0,y2:cnv.height-mec.ursprung.y,ld:[6,3], ls:"black", lw:1})
                //.lin({x1:-mec.ursprung.x,y1:0,x2:cnv.width,y2:0,ld:[6,3], ls:"black", lw:1});
    world.exe(ctx);

const mec = {
    x0: 0,
    y0: 0,
    flags: {
        runAnimation: false,
        isDragging: false,
        dirty: false,
    },

    init(){
        const state = {x:this.x0,y:this.y0,cartesian:this.cartesian};
        this._interactor = canvasInteractor.create(ctx, state);
        this._selector = g2.selector(this._interactor.evt);
        this._selector.selectable({x: this.x,y:this.y})
        this._interactor.on('tick', e => this.ontick(e))
                        .on('pan', e => this.onpan(e))
                        .on('drag', e => this.ondrag(e))
                        .on('wheel', e => this.onwheel(e))
                        .on('click', e => {
                            this._selector.selection = {x: e.x, y: e.y}
                            this._selector.selection.drag = true;
                        });
        this._interactor.startTimer();
        document.dispatchEvent(new CustomEvent('init'));
    },
    ontick(e) {
        document.dispatchEvent(new CustomEvent('tick'));
/*         if (this.interactive)
            this._g.exe(this._selector); */
    world.exe(this._selector);
    },
    onpan(e) { 
        this._interactor.view.x = this.x0 += e.dx;
        this._interactor.view.y = this.y0 += e.dy;
    },
    ondrag(e) {    // only modify selected geometry here .. do not redraw .. !
        if (this._selector.selection && this._selector.selection.drag) {
            this._selector.selection.drag({x:e.xusr,y:e.yusr,dx:e.dxusr,dy:e.dyusr,mode:'drag'});
            document.dispatchEvent(new CustomEvent('drag'));
        }
    },
    onwheel(e) {
        this._interactor.view.x = e.x + e.dscl*(this._interactor.view.x - e.x);
        this._interactor.view.y = e.y + e.dscl*(this._interactor.view.y - e.y);
        this._interactor.view.scl *= e.dscl;
    }

}
const render = () => {
    if (mec.flags.runAnimation || mec.flags.dirty || mec.flags.isDragging) {
        world.exe(ctx);
        requestAnimationFrame(render);
    }
}

mec.init();
//render();