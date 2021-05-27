/** 
 * @requires v2.js
 * @requires canvasInteractor.js
 * @requires g2.js
 * @requires g2.selector.js
*/

const wheel1 = g2().del().rec({x: -7.5, y: -20,b:15,h:40,fs:'dimgray'})
                        .lin({x1:-5.5,y1:-16,x2:5.5,y2:-16})
                        .lin({x1:-5.5,y1:-12,x2:5.5,y2:-12})
                        .lin({x1:-5.5,y1:-4,x2:5.5,y2:-4})
                        .lin({x1:-5.5,y1:4,x2:5.5,y2:4})
                        .lin({x1:-5.5,y1:12,x2:5.5,y2:12})
                        .lin({x1:-5.5,y1:16,x2:5.5,y2:16});
const axis1 = g2().del().bar2({x1:-50,y1:0,x2:50,y2:0})
                        .cir({x:0, y:0,r:5})
                        .use({grp:wheel1,x:50,y:0})
                        .use({grp:wheel1,x:-50,y:0});

const vehicle = {
    create() {
        const self = Object.create(this.prototype);
        self.constructor.apply(self,arguments); 
        return self; 
    },
    prototype: {
        constructor(){
            this.origin = {x:200,y:300,cartesian:true};
            this._drawbar = 150;
            this.steeringAngle = -90,
            this.chassisAngle = 180,
            this._ctx = document.getElementById('c').getContext('2d');
            this._interactor = canvasInteractor.create(this._ctx, {x,y,cartesian} = this.origin );
            this._selector = g2.selector(this._interactor.evt);
            this._g = g2().clr().grid({color: "grey", size: 20}).view(this._interactor.view).lin({x1:0,y1:1000,x2:0,y2:-1000,lw:2}).lin({x1:-500,y1:0,x2:1000,y2:0,lw:2}).ply({pts:this.drawTractrix(this.drawbar),lw:1.5,ls:'#f50035'});
            this.cache = [v2({ x:0,y:0,label:'A' }),v2({ x:0,y:0,label:'A' }),v2({ x:0,y:0,label:'A' })];
            this._traceB = [];
            this.circularTractrix = [];
            //this.phitick = 0;
            this._A = v2({ x:0,y:0,label:'A' });
            this._B = v2({ x:0,y:0,label:'B' });
            //set nodes and pols
            this.B.iadd(v2({ x: 1, y: 0 }).rot(this.toRad(this.chassisAngle)).neg.scl(this.drawbar));
            this._u = v2(this.e).rot(this.toRad(this.steeringAngle));


            this._frontWheel = {grp:wheel1, x:this.A.x, y: this.A.y, w: this.u/* v2(this.u).tilde.w */ };
            this._rearWheel = { grp:axis1, x: this.B.x,y: this.B.y, w: v2(this.e).tilde.w };

            this._tick = 0;
            this._phitick = 0;
            this._isActive = false;
            this._keyFrame = false;
            this._traceB = [];
        
        this.init();
        },
        get BA() { return this.A.add(this.B.neg); },
        get B0() { return this.u.tilde.scl(this.r).neg; },
        get PA() { return this.A.add(this.P.neg); },
        get PB() { return this.B.add(this.P.neg); },
        get BB0() { return this.P.add(this.B.neg); },
        get AA0() { return this.getCurvature(this.cache); },
        get PW() { return v2(this.e).scl((this.r**2 - (this.r**3)/this.AA0 /* v2.len(this.AA0) */)/this.drawbar); },
        get PT() { return this.PW.tilde.scl(this.PA.r**2/this.PW.perp(this.PA)); },
        //get A0() { return this.A.add(this.PA.unit.scl(this.AA0)); },
        get A() {return this._A},
        set A(o) {this._A.x = o.x; this._A.y = o.y},
        get B() { return this._B },
        set B(o) { this._B.x = o.x, this._B.y = o.y },

        // Pole der ebenen Bewegung
        get P() { return this.A.add(this.u.tilde.scl(this.r)); },// Momentanpol
        get W() { return this.P.add(this.PW); }, // Wendepol
        get T() { return this.P.add(this.PT); }, // Tangentialpol
        //
        get inflCir() { return this.P.add(this.PW.scl(0.5)); },
        get tangCir() { return this.P.add(this.PT.scl(0.5)); },
        get traceB() { return this._traceB },
        set traceB(o) {
            this._traceB.push({ x: o.x, y: o.y }) 
        },
        // Richtungsvektoren
        get e() { return this.BA.unit },
        get u() { return this.e.rot(this.toRad(this.steeringAngle))
            /* this._u; */ },
        set u(o) {this._u.x = o.x; this._u.y = o.y},
        //geometry
        get drawbar() { return this._drawbar; },
        set drawbar(int) { this._drawbar = int; },
        get h() { return (this.e.dot(this.u) / this.e.perp(this.u)) * this.drawbar },
        get r() { return - (1 * this.drawbar) / v2(this.u).tilde.dot(this.e); },
        get v() { return 1; }, //velocity [m/s]
        //model orientation
        get frontWheel() {return this._frontWheel; },
        set frontWheel(o) { this._frontWheel.x = o.x; this._frontWheel.y = o.y; this._frontWheel.w = o.w; },
        get rearWheel() {return this._rearWheel; },
        set rearWheel(o) { this._rearWheel.x = o.x; this._rearWheel.y = o.y; this._rearWheel.w = o.w; },
        //
        get omega() { return (this.v/this.drawbar) * this.e.perp(this.u); },
        get dotOmega() { return -((this.omega**3)/this.v)*this.PW.dot(this.u); },
        get gamma() { return v2.angle(this.u,this.e)},
        init(){
            this._g.use({grp:this.getAxisLabel()})
                    .ply({pts:[this.A,this.B],lw:4,ls:'#003d61'})
                    .ply({pts:this.circularTractrix,ls:'red'})
                    .ply({pts: () => this.traceB,lw:2,ls:'OrangeRed'})
                    .use(this.frontWheel)
                    .use(this._rearWheel)
                    //.wheel({x,y,r} = Object.assign({r:10},this.A))
                    .pol( {p: () => this.P ,label:'P'} )
                    .pol( {p: () => this.W ,label:'W'} )
                    .pol( {p: () => this.T ,label:'T'} )
                    //.cir( {p: () => this.inflCir, r: () => this.PW.r/2, fs:'rgba(10,140,200,0.25)'})
                    //.cir( {p: () => this.tangCir, r: () => this.PT.r/2,fs:'rgba(193,66,66,0.25)'} )
                    .hdl( {p:this.B, label:'B'})
                    .hdl( {p:this.A, label:'A'});
                  
            this._interactor.on('tick', e => { this.ontick(e); })
                            .on('drag', e => { this.ondrag(e); })
                            .startTimer();
        },
        getPhi(ds) { return this.omega * ds + (this.dotOmega * (ds)**2)/2; },
        getCurvature(points){
            const [A,B,C] = points;
            const AB = A.add(B),
                  BC = B.add(C),
                  //lambda = 0.5 * v2.dot(v2.dif(AB,BC),AB) / v2.perp(BC,AB),
                  mu = -0.5 * AB.sub(BC).dot(BC) / AB.perp(BC),
                  center = AB.scl(0.5).add(AB.tilde.scl(mu)),
                  radius = A.add(center.neg).r;
                  //console.log('radius: ',radius,'center: ', center)
            return !isNaN(radius) ? radius : Infinity;
        },
        toRad(deg){ return deg === 0 ? 0.001*Math.PI/180 : deg*Math.PI/180},
        getAxisLabel(){
            const hLine = i => g2().del().lin({x1:0,y1:0,x2:20,y2:0, label:{str:`${i}m`}});
            const vLine = i => g2().del().lin({x1:0,y1:0,x2:0,y2:20, label:`${i}m`});
            const label = g2().del();
            for(let i = 1; i< 10; i++) label.use({grp:hLine(i), x:-20,y: i * 100}).use({grp:vLine(i),x:i*100, y:-20})
            return label;
        },
        drive(){
            this.A.iadd(this.u.scl(100*this.v/60));
            this.B = this.P.add(this.e.neg.tilde.rot(this.getPhi(1/60)).scl(this.h));
            this.frontWheel = { x:this.A.x,y:this.A.y, w:this.u.tilde.w };
            this.rearWheel = { x:this.B.x,y:this.B.y, w:this.e.tilde.w };
            this.cache.push(this.A.cpy);
            if(this.cache.length > 3) this.cache.shift();
            this.traceB = this.B;
        },
        driveForward(ds,n){ // Simulation der Vorwärtsfahrt 
            const ticks = 1/ds;
            const trajectory = [{tractrix: {x:this.B.x,y:this.B.y}, directrix: {x:this.A.x,y:this.A.y}}];
            this.u = v2.yunit;
            for (let i=0; i<n; i++){
                while(this._tick !== ticks){
                    this._tick ++;
                    this.A.iadd(this.u.scl(100*this.v/ticks));
                    this.B = this.P.add(this.e.neg.tilde.rot(this.getPhi(ds)).scl(this.h));
                    this.frontWheel = { x:this.A.x,y:this.A.y, w:this.u.tilde.w };
                    this.rearWheel = { x:this.B.x,y:this.B.y, w:this.e.tilde.w };
                    this.cache.push(this.A.cpy);
                    if(this.cache.length > 3) this.cache.shift();
                    trajectory.push({tractrix: {x:this.B.x,y:this.B.y}, directrix: {x:this.A.x,y:this.A.y}});
                }
            this._g.ply({pts:[this.A.x,this.A.y,this.B.x,this.B.y],lw:2,ls:'#003d61'})
                   .hdl( {x:this.B.x,y:this.B.y, r:3})
                   .hdl( {x:this.A.x,y:this.A.y, r:3});
            this._tick = 0;
            }
            return trajectory;
        },
        driveCircular(ds,rho,n){ // Simulation der Kreisfahrt
            this._traceB = [];
            const ticks = 1/ds;
            const trajectory = [{tractrix: {x:this.B.x,y:this.B.y}, directrix: {x:this.A.x,y:this.A.y}}];
            this.u = v2.yunit;
            const T = Math.abs((2 * Math.PI * rho/100)/ this.v); // Umlaufzeit
            let dphi = 0
            for(let j=0; j<n;j++){
                for (let i=0; i < T; i++){
                    while(this._tick !== ticks){
                    
                        this._tick ++;
                        dphi += this.toRad(360 / T)/ticks;
                        this.A = v2({x:rho,y:0}).add(v2.xunit.neg.rot(dphi).scl(rho));
                        //this.A.irot(dphi);
                        this.B = this.P.add(this.e.neg.tilde.rot(this.getPhi(ds)).scl(this.h));
                        this.frontWheel = { x:this.A.x,y:this.A.y, w:this.u.tilde.w };
                        this.rearWheel = { x:this.B.x,y:this.B.y, w:this.e.tilde.w };
                        this.cache.push(this.A.cpy);
                        if(this.cache.length > 3) this.cache.shift();
                        trajectory.push({tractrix: {x:this.B.x,y:this.B.y}, directrix: {x:this.A.x,y:this.A.y}});
                        this.traceB = this.B;

                    }
                    if(i%2 === 0 && j === 0){
                        this._g.ply({pts:[this.A.x,this.A.y,this.B.x,this.B.y],lw:2,ls:'#003d61'})
                        .hdl( {x:this.B.x,y:this.B.y, r:3})
                        .hdl( {x:this.A.x,y:this.A.y, r:3});
                    }
                this._tick = 0;
                }
            }
            return trajectory;
        },
        drawTractrix(drawbar){
            const tractrixPly = [];
            for(let y = 0;y<250;y++){
                // Gleichung der Traktrix in kartesischen Koordinaten
                const x = drawbar * Math.acosh(drawbar/y) - Math.sqrt(drawbar**2 - y**2);
                tractrixPly.push({x:y,y:x});
            }
            console.log(tractrixPly)
            return tractrixPly;
        },
        ontick(e){
            if(this._isActive){ this.drive(); }
            this._g.exe(this._selector).exe(this._ctx);
        },
        ondrag(e){// only modify selected geometry here .. do not redraw .. !
            if (this._selector.selection && this._selector.selection.drag && this._selector.selection.label === 'A') {
                this._tick++;
                this._selector.selection.drag({x:e.xusr,y:e.yusr,dx:e.dxusr,dy:e.dyusr,mode:'drag'});
                this.steeringAngle = v2.angle(this.e,{y:e.dy, x:e.dx})*180/Math.PI;
                console.log(e)
                //this.u.iscl(this.v).iadd({x:e.dxusr,y:e.dyusr}).iunit();
                this.B = this.P.add(this.e.neg.tilde.rot(this.getPhi(1/60)).scl(this.h));

                this.frontWheel = { x:this.A.x,y:this.A.y, w:this.u.tilde.w };
                this.rearWheel = { x:this.B.x,y:this.B.y, w:this.e.tilde.w };

                this.cache.push(this.A.cpy);
                if(this.cache.length > 3) this.cache.shift();
                this.traceB = this.B;
            }
            else if (this._selector.selection && this._selector.selection.drag && this._selector.selection.label === 'B'){
                this._selector.selection.drag({x:e.xusr,y:e.yusr,dx:e.dxusr,dy:e.dyusr,mode:'drag'});
                this.A.iadd({x:e.dxusr,y:e.dyusr});
                this.frontWheel = { x:this.A.x,y:this.A.y, w:this.u.tilde.w };
                this.rearWheel = { x:this.B.x,y:this.B.y, w:this.e.tilde.w };
            }
        }
    }
}

globalThis.model = vehicle.create();

const ctrlUpdate = () => document.getElementById('ctrl').update(); //ctrl-ing API for manual update