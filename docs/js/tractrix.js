/* const cnv = document.getElementById('c'),  
    ctx = cnv.getContext('2d'),
    //fourBar = g2(),
    world = g2().clr()
                .view(mec._interactor.view)
                //.use({grp: fourBar})
                .grid({color: "grey", size: 20})
                .nod({x:100, y:100 , draggable:true})
                //.lin({x1:0,y1:-mec.ursprung.y,x2:0,y2:cnv.height-mec.ursprung.y,ld:[6,3], ls:"black", lw:1})
                //.lin({x1:-mec.ursprung.x,y1:0,x2:cnv.width,y2:0,ld:[6,3], ls:"black", lw:1});
 */
const mec = {
    spline: [],
    x0: 0,
    y0: 0,
    flags: {
        runAnimation: false,
        isDragging: false,
        dirty: false,
    },
    ctx: document.getElementById('c').getContext('2d'),
    world: g2(),
    init(){
        const state = {x:this.x0,y:this.y0,cartesian: true};
        this._interactor = canvasInteractor.create(this.ctx, state);
        this._selector = g2.selector(this._interactor.evt);
        this._interactor.on('tick', e => this.ontick(e))
                        //.on('pan', e => this.onpan(e))
                        .on('drag', e => this.ondrag(e))
                        .on('pointerdown', e => this.onpointerdown(e))
                        //.on('pointermove', e => this.onpointermove(e))
                        //.on('pointerup', e => this.onpointerup(e))
                        //.on('wheel', e => this.onwheel(e))
                        .startTimer();
        this.world.clr()
                  .view(this._interactor.view)
                  .grid({color: "grey", size: 20});
                  //.nod({x:100, y:100 , draggable:true});
                  console.log(this._interactor)
    },

    ontick(e) {
/*         if (this.interactive)
            this._g.exe(this._selector); */
        this.world.exe(this._selector).ply({pts: this.spline,ls:'blue',lw:3}).exe(this.ctx);
    },
    onpan(e) { 
        this._interactor.view.x += e.dx;
        this._interactor.view.y += e.dy;
         
        console.log(this._selector)
    },
    ondrag(e) {    // only modify selected geometry here .. do not redraw .. !
        if (this._selector.selection && this._selector.selection.drag) {
            this._selector.selection.drag({x:e.xusr,y:e.yusr,dx:e.dxusr,dy:e.dyusr,mode:'drag'});
        }  
    },
    onpointerdown(e){
        this.flags.dirty = true;     
        console.log(this.flags.dirty);
        this._interactor.on('pointermove', e => mec.onpointermove(e))
                        .on('pointerup', mec.onpointerup());
        console.log(this._interactor.signals)         
    },
    onpointermove(e){
        if(this.flags.dirty) {
            this.spline.push({x:e.x,y:e.y});
        }
    },
    onpointerup(){
        console.log(this.spline)
        this.flags.dirty = false;
        console.log(this.flags.dirty);
        this._interactor.remove('pointermove', mec.onpointermove)
                        .remove('pointerup', mec.onpointerup);
    }
    /* onwheel(e) {
        this._interactor.view.x = e.x + e.dscl*(this._interactor.view.x - e.x);
        this._interactor.view.y = e.y + e.dscl*(this._interactor.view.y - e.y);
        this._interactor.view.scl *= e.dscl;
    } */

}
const render = () => {
    if (mec.flags.runAnimation || mec.flags.dirty || mec.flags.isDragging) {
        world.exe(ctx);
        requestAnimationFrame(render);
    }
}

mec.init();
//render();