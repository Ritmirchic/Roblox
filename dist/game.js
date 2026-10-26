var Zl="169";var zd=0,Dc=1,Ud=2;var Oh=1,Kl=2,Yi=3,Ii=0,Ze=1,_e=2,un=0,ns=1,Oi=2,Nc=3,zc=4,Od=5,Rn=100,Fd=101,Bd=102,Hd=103,Vd=104,Gd=200,Wd=201,qd=202,Xd=203,Lo=204,Do=205,$d=206,Yd=207,jd=208,Zd=209,Kd=210,Jd=211,Qd=212,tu=213,eu=214,No=0,zo=1,Uo=2,os=3,Oo=4,Fo=5,Bo=6,Ho=7,Fh=0,iu=1,nu=2,fn=0,su=1,ru=2,au=3,Jl=4,ou=5,lu=6,cu=7;var Bh=300,ls=301,cs=302,Vo=303,Go=304,pa=306,Pn=1e3,Zi=1001,Wo=1002,oi=1003,hu=1004;var hr=1005;var We=1006,Qa=1007;var Pi=1008;var li=1009,Hh=1010,Vh=1011,Ls=1012,Ql=1013,In=1014,Ui=1015,Bs=1016,tc=1017,ec=1018,hs=1020,Gh=35902,Wh=1021,qh=1022,je=1023,Xh=1024,$h=1025,ss=1026,ds=1027,ic=1028,nc=1029,Yh=1030,sc=1031;var rc=1033,Nr=33776,zr=33777,Ur=33778,Or=33779,qo=35840,Xo=35841,$o=35842,Yo=35843,jo=36196,Zo=37492,Ko=37496,Jo=37808,Qo=37809,tl=37810,el=37811,il=37812,nl=37813,sl=37814,rl=37815,al=37816,ol=37817,ll=37818,cl=37819,hl=37820,dl=37821,Fr=36492,ul=36494,fl=36495,jh=36283,pl=36284,ml=36285,gl=36286;var Hr=2300,yl=2301,to=2302,Uc=2400,Oc=2401,Fc=2402;var du=3200,uu=3201;var Zh=0,fu=1,gi="",Ye="srgb",xn="srgb-linear",ac="display-p3",ma="display-p3-linear",Vr="linear",Te="srgb",Gr="rec709",Wr="p3";var Hn=7680;var Bc=519,pu=512,mu=513,gu=514,Kh=515,yu=516,xu=517,vu=518,bu=519,Hc=35044;var Vc="300 es",Ki=2e3,qr=2001,pn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let n=this._listeners[t];if(n!==void 0){let s=n.indexOf(e);s!==-1&&n.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let i=this._listeners[t.type];if(i!==void 0){t.target=this;let n=i.slice(0);for(let s=0,r=n.length;s<r;s++)n[s].call(this,t);t.target=null}}},Xe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var eo=Math.PI/180,Xr=180/Math.PI;function Hs(){let a=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Xe[a&255]+Xe[a>>8&255]+Xe[a>>16&255]+Xe[a>>24&255]+"-"+Xe[t&255]+Xe[t>>8&255]+"-"+Xe[t>>16&15|64]+Xe[t>>24&255]+"-"+Xe[e&63|128]+Xe[e>>8&255]+"-"+Xe[e>>16&255]+Xe[e>>24&255]+Xe[i&255]+Xe[i>>8&255]+Xe[i>>16&255]+Xe[i>>24&255]).toLowerCase()}function ai(a,t,e){return Math.max(t,Math.min(e,a))}function wu(a,t){return(a%t+t)%t}function io(a,t,e){return(1-e)*a+e*t}function _s(a,t){switch(t.constructor){case Float32Array:return a;case Uint32Array:return a/4294967295;case Uint16Array:return a/65535;case Uint8Array:return a/255;case Int32Array:return Math.max(a/2147483647,-1);case Int16Array:return Math.max(a/32767,-1);case Int8Array:return Math.max(a/127,-1);default:throw new Error("Invalid component type.")}}function ri(a,t){switch(t.constructor){case Float32Array:return a;case Uint32Array:return Math.round(a*4294967295);case Uint16Array:return Math.round(a*65535);case Uint8Array:return Math.round(a*255);case Int32Array:return Math.round(a*2147483647);case Int16Array:return Math.round(a*32767);case Int8Array:return Math.round(a*127);default:throw new Error("Invalid component type.")}}var Xt=class a{constructor(t=0,e=0){a.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,i=this.y,n=t.elements;return this.x=n[0]*e+n[3]*i+n[6],this.y=n[1]*e+n[4]*i+n[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(ai(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let i=Math.cos(e),n=Math.sin(e),s=this.x-t.x,r=this.y-t.y;return this.x=s*i-r*n+t.x,this.y=s*n+r*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Zt=class a{constructor(t,e,i,n,s,r,o,l,c){a.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,n,s,r,o,l,c)}set(t,e,i,n,s,r,o,l,c){let h=this.elements;return h[0]=t,h[1]=n,h[2]=o,h[3]=e,h[4]=s,h[5]=l,h[6]=i,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,n=e.elements,s=this.elements,r=i[0],o=i[3],l=i[6],c=i[1],h=i[4],d=i[7],u=i[2],f=i[5],g=i[8],y=n[0],p=n[3],m=n[6],x=n[1],v=n[4],b=n[7],_=n[2],A=n[5],T=n[8];return s[0]=r*y+o*x+l*_,s[3]=r*p+o*v+l*A,s[6]=r*m+o*b+l*T,s[1]=c*y+h*x+d*_,s[4]=c*p+h*v+d*A,s[7]=c*m+h*b+d*T,s[2]=u*y+f*x+g*_,s[5]=u*p+f*v+g*A,s[8]=u*m+f*b+g*T,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[1],n=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*r*h-e*o*c-i*s*h+i*o*l+n*s*c-n*r*l}invert(){let t=this.elements,e=t[0],i=t[1],n=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*r-o*c,u=o*l-h*s,f=c*s-r*l,g=e*d+i*u+n*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/g;return t[0]=d*y,t[1]=(n*c-h*i)*y,t[2]=(o*i-n*r)*y,t[3]=u*y,t[4]=(h*e-n*l)*y,t[5]=(n*s-o*e)*y,t[6]=f*y,t[7]=(i*l-c*e)*y,t[8]=(r*e-i*s)*y,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,n,s,r,o){let l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*r+c*o)+r+t,-n*c,n*l,-n*(-c*r+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(no.makeScale(t,e)),this}rotate(t){return this.premultiply(no.makeRotation(-t)),this}translate(t,e){return this.premultiply(no.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,i=t.elements;for(let n=0;n<9;n++)if(e[n]!==i[n])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},no=new Zt;function Jh(a){for(let t=a.length-1;t>=0;--t)if(a[t]>=65535)return!0;return!1}function $r(a){return document.createElementNS("http://www.w3.org/1999/xhtml",a)}function _u(){let a=$r("canvas");return a.style.display="block",a}var Gc={};function Br(a){a in Gc||(Gc[a]=!0,console.warn(a))}function Mu(a,t,e){return new Promise(function(i,n){function s(){switch(a.clientWaitSync(t,a.SYNC_FLUSH_COMMANDS_BIT,0)){case a.WAIT_FAILED:n();break;case a.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:i()}}setTimeout(s,e)})}function Su(a){let t=a.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Eu(a){let t=a.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var Wc=new Zt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),qc=new Zt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ms={[xn]:{transfer:Vr,primaries:Gr,luminanceCoefficients:[.2126,.7152,.0722],toReference:a=>a,fromReference:a=>a},[Ye]:{transfer:Te,primaries:Gr,luminanceCoefficients:[.2126,.7152,.0722],toReference:a=>a.convertSRGBToLinear(),fromReference:a=>a.convertLinearToSRGB()},[ma]:{transfer:Vr,primaries:Wr,luminanceCoefficients:[.2289,.6917,.0793],toReference:a=>a.applyMatrix3(qc),fromReference:a=>a.applyMatrix3(Wc)},[ac]:{transfer:Te,primaries:Wr,luminanceCoefficients:[.2289,.6917,.0793],toReference:a=>a.convertSRGBToLinear().applyMatrix3(qc),fromReference:a=>a.applyMatrix3(Wc).convertLinearToSRGB()}},Tu=new Set([xn,ma]),me={enabled:!0,_workingColorSpace:xn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(a){if(!Tu.has(a))throw new Error(`Unsupported working color space, "${a}".`);this._workingColorSpace=a},convert:function(a,t,e){if(this.enabled===!1||t===e||!t||!e)return a;let i=Ms[t].toReference,n=Ms[e].fromReference;return n(i(a))},fromWorkingColorSpace:function(a,t){return this.convert(a,this._workingColorSpace,t)},toWorkingColorSpace:function(a,t){return this.convert(a,t,this._workingColorSpace)},getPrimaries:function(a){return Ms[a].primaries},getTransfer:function(a){return a===gi?Vr:Ms[a].transfer},getLuminanceCoefficients:function(a,t=this._workingColorSpace){return a.fromArray(Ms[t].luminanceCoefficients)}};function rs(a){return a<.04045?a*.0773993808:Math.pow(a*.9478672986+.0521327014,2.4)}function so(a){return a<.0031308?a*12.92:1.055*Math.pow(a,.41666)-.055}var Vn,xl=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Vn===void 0&&(Vn=$r("canvas")),Vn.width=t.width,Vn.height=t.height;let i=Vn.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=Vn}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=$r("canvas");e.width=t.width,e.height=t.height;let i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let n=i.getImageData(0,0,t.width,t.height),s=n.data;for(let r=0;r<s.length;r++)s[r]=rs(s[r]/255)*255;return i.putImageData(n,0,0),e}else if(t.data){let e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(rs(e[i]/255)*255):e[i]=rs(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Au=0,Yr=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Au++}),this.uuid=Hs(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},n=this.data;if(n!==null){let s;if(Array.isArray(n)){s=[];for(let r=0,o=n.length;r<o;r++)n[r].isDataTexture?s.push(ro(n[r].image)):s.push(ro(n[r]))}else s=ro(n);i.url=s}return e||(t.images[this.uuid]=i),i}};function ro(a){return typeof HTMLImageElement<"u"&&a instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&a instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&a instanceof ImageBitmap?xl.getDataURL(a):a.data?{data:Array.from(a.data),width:a.width,height:a.height,type:a.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Ru=0,yi=class a extends pn{constructor(t=a.DEFAULT_IMAGE,e=a.DEFAULT_MAPPING,i=Zi,n=Zi,s=We,r=Pi,o=je,l=li,c=a.DEFAULT_ANISOTROPY,h=gi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ru++}),this.uuid=Hs(),this.name="",this.source=new Yr(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=n,this.magFilter=s,this.minFilter=r,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Xt(0,0),this.repeat=new Xt(1,1),this.center=new Xt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Zt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Bh)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Pn:t.x=t.x-Math.floor(t.x);break;case Zi:t.x=t.x<0?0:1;break;case Wo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Pn:t.y=t.y-Math.floor(t.y);break;case Zi:t.y=t.y<0?0:1;break;case Wo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};yi.DEFAULT_IMAGE=null;yi.DEFAULT_MAPPING=Bh;yi.DEFAULT_ANISOTROPY=1;var ve=class a{constructor(t=0,e=0,i=0,n=1){a.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=n}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,n){return this.x=t,this.y=e,this.z=i,this.w=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,i=this.y,n=this.z,s=this.w,r=t.elements;return this.x=r[0]*e+r[4]*i+r[8]*n+r[12]*s,this.y=r[1]*e+r[5]*i+r[9]*n+r[13]*s,this.z=r[2]*e+r[6]*i+r[10]*n+r[14]*s,this.w=r[3]*e+r[7]*i+r[11]*n+r[15]*s,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,n,s,l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],g=l[9],y=l[2],p=l[6],m=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-y)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+y)<.1&&Math.abs(g+p)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let v=(c+1)/2,b=(f+1)/2,_=(m+1)/2,A=(h+u)/4,T=(d+y)/4,k=(g+p)/4;return v>b&&v>_?v<.01?(i=0,n=.707106781,s=.707106781):(i=Math.sqrt(v),n=A/i,s=T/i):b>_?b<.01?(i=.707106781,n=0,s=.707106781):(n=Math.sqrt(b),i=A/n,s=k/n):_<.01?(i=.707106781,n=.707106781,s=0):(s=Math.sqrt(_),i=T/s,n=k/s),this.set(i,n,s,e),this}let x=Math.sqrt((p-g)*(p-g)+(d-y)*(d-y)+(u-h)*(u-h));return Math.abs(x)<.001&&(x=1),this.x=(p-g)/x,this.y=(d-y)/x,this.z=(u-h)/x,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},vl=class extends pn{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ve(0,0,t,e),this.scissorTest=!1,this.viewport=new ve(0,0,t,e);let n={width:t,height:e,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:We,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let s=new yi(n,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];let r=i.count;for(let o=0;o<r;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let n=0,s=this.textures.length;n<s;n++)this.textures[n].image.width=t,this.textures[n].image.height=e,this.textures[n].image.depth=i;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let i=0,n=t.textures.length;i<n;i++)this.textures[i]=t.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new Yr(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ji=class extends vl{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}},jr=class extends yi{constructor(t=null,e=1,i=1,n=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:n},this.magFilter=oi,this.minFilter=oi,this.wrapR=Zi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var bl=class extends yi{constructor(t=null,e=1,i=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:n},this.magFilter=oi,this.minFilter=oi,this.wrapR=Zi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ei=class{constructor(t=0,e=0,i=0,n=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=n}static slerpFlat(t,e,i,n,s,r,o){let l=i[n+0],c=i[n+1],h=i[n+2],d=i[n+3],u=s[r+0],f=s[r+1],g=s[r+2],y=s[r+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d;return}if(o===1){t[e+0]=u,t[e+1]=f,t[e+2]=g,t[e+3]=y;return}if(d!==y||l!==u||c!==f||h!==g){let p=1-o,m=l*u+c*f+h*g+d*y,x=m>=0?1:-1,v=1-m*m;if(v>Number.EPSILON){let _=Math.sqrt(v),A=Math.atan2(_,m*x);p=Math.sin(p*A)/_,o=Math.sin(o*A)/_}let b=o*x;if(l=l*p+u*b,c=c*p+f*b,h=h*p+g*b,d=d*p+y*b,p===1-o){let _=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=_,c*=_,h*=_,d*=_}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,i,n,s,r){let o=i[n],l=i[n+1],c=i[n+2],h=i[n+3],d=s[r],u=s[r+1],f=s[r+2],g=s[r+3];return t[e]=o*g+h*d+l*f-c*u,t[e+1]=l*g+h*u+c*d-o*f,t[e+2]=c*g+h*f+o*u-l*d,t[e+3]=h*g-o*d-l*u-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,n){return this._x=t,this._y=e,this._z=i,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let i=t._x,n=t._y,s=t._z,r=t._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(n/2),d=o(s/2),u=l(i/2),f=l(n/2),g=l(s/2);switch(r){case"XYZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"YXZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"ZXY":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"ZYX":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"YZX":this._x=u*h*d+c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d-u*f*g;break;case"XZY":this._x=u*h*d-c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d+u*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let i=e/2,n=Math.sin(i);return this._x=t.x*n,this._y=t.y*n,this._z=t.z*n,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,i=e[0],n=e[4],s=e[8],r=e[1],o=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=i+o+d;if(u>0){let f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(s-c)*f,this._z=(r-n)*f}else if(i>o&&i>d){let f=2*Math.sqrt(1+i-o-d);this._w=(h-l)/f,this._x=.25*f,this._y=(n+r)/f,this._z=(s+c)/f}else if(o>d){let f=2*Math.sqrt(1+o-i-d);this._w=(s-c)/f,this._x=(n+r)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+d-i-o);this._w=(r-n)/f,this._x=(s+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ai(this.dot(t),-1,1)))}rotateTowards(t,e){let i=this.angleTo(t);if(i===0)return this;let n=Math.min(1,e/i);return this.slerp(t,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let i=t._x,n=t._y,s=t._z,r=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=i*h+r*o+n*c-s*l,this._y=n*h+r*l+s*o-i*c,this._z=s*h+r*c+i*l-n*o,this._w=r*h-i*o-n*l-s*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let i=this._x,n=this._y,s=this._z,r=this._w,o=r*t._w+i*t._x+n*t._y+s*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=r,this._x=i,this._y=n,this._z=s,this;let l=1-o*o;if(l<=Number.EPSILON){let f=1-e;return this._w=f*r+e*this._w,this._x=f*i+e*this._x,this._y=f*n+e*this._y,this._z=f*s+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),d=Math.sin((1-e)*h)/c,u=Math.sin(e*h)/c;return this._w=r*d+this._w*u,this._x=i*d+this._x*u,this._y=n*d+this._y*u,this._z=s*d+this._z*u,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),n=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(n*Math.sin(t),n*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},P=class a{constructor(t=0,e=0,i=0){a.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Xc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Xc.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,i=this.y,n=this.z,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6]*n,this.y=s[1]*e+s[4]*i+s[7]*n,this.z=s[2]*e+s[5]*i+s[8]*n,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,i=this.y,n=this.z,s=t.elements,r=1/(s[3]*e+s[7]*i+s[11]*n+s[15]);return this.x=(s[0]*e+s[4]*i+s[8]*n+s[12])*r,this.y=(s[1]*e+s[5]*i+s[9]*n+s[13])*r,this.z=(s[2]*e+s[6]*i+s[10]*n+s[14])*r,this}applyQuaternion(t){let e=this.x,i=this.y,n=this.z,s=t.x,r=t.y,o=t.z,l=t.w,c=2*(r*n-o*i),h=2*(o*e-s*n),d=2*(s*i-r*e);return this.x=e+l*c+r*d-o*h,this.y=i+l*h+o*c-s*d,this.z=n+l*d+s*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,i=this.y,n=this.z,s=t.elements;return this.x=s[0]*e+s[4]*i+s[8]*n,this.y=s[1]*e+s[5]*i+s[9]*n,this.z=s[2]*e+s[6]*i+s[10]*n,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let i=t.x,n=t.y,s=t.z,r=e.x,o=e.y,l=e.z;return this.x=n*l-s*o,this.y=s*r-i*l,this.z=i*o-n*r,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return ao.copy(this).projectOnVector(t),this.sub(ao)}reflect(t){return this.sub(ao.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(ai(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y,n=this.z-t.z;return e*e+i*i+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){let n=Math.sin(e)*t;return this.x=n*Math.sin(i),this.y=Math.cos(e)*t,this.z=n*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),n=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=n,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ao=new P,Xc=new ei,Mi=class{constructor(t=new P(1/0,1/0,1/0),e=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(Ri.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(Ri.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let i=Ri.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let s=i.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=s.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,Ri):Ri.fromBufferAttribute(s,r),Ri.applyMatrix4(t.matrixWorld),this.expandByPoint(Ri);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),dr.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),dr.copy(i.boundingBox)),dr.applyMatrix4(t.matrixWorld),this.union(dr)}let n=t.children;for(let s=0,r=n.length;s<r;s++)this.expandByObject(n[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ri),Ri.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ss),ur.subVectors(this.max,Ss),Gn.subVectors(t.a,Ss),Wn.subVectors(t.b,Ss),qn.subVectors(t.c,Ss),an.subVectors(Wn,Gn),on.subVectors(qn,Wn),wn.subVectors(Gn,qn);let e=[0,-an.z,an.y,0,-on.z,on.y,0,-wn.z,wn.y,an.z,0,-an.x,on.z,0,-on.x,wn.z,0,-wn.x,-an.y,an.x,0,-on.y,on.x,0,-wn.y,wn.x,0];return!oo(e,Gn,Wn,qn,ur)||(e=[1,0,0,0,1,0,0,0,1],!oo(e,Gn,Wn,qn,ur))?!1:(fr.crossVectors(an,on),e=[fr.x,fr.y,fr.z],oo(e,Gn,Wn,qn,ur))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ri).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ri).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Gi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Gi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Gi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Gi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Gi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Gi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Gi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Gi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Gi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},Gi=[new P,new P,new P,new P,new P,new P,new P,new P],Ri=new P,dr=new Mi,Gn=new P,Wn=new P,qn=new P,an=new P,on=new P,wn=new P,Ss=new P,ur=new P,fr=new P,_n=new P;function oo(a,t,e,i,n){for(let s=0,r=a.length-3;s<=r;s+=3){_n.fromArray(a,s);let o=n.x*Math.abs(_n.x)+n.y*Math.abs(_n.y)+n.z*Math.abs(_n.z),l=t.dot(_n),c=e.dot(_n),h=i.dot(_n);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Cu=new Mi,Es=new P,lo=new P,mn=class{constructor(t=new P,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let i=this.center;e!==void 0?i.copy(e):Cu.setFromPoints(t).getCenter(i);let n=0;for(let s=0,r=t.length;s<r;s++)n=Math.max(n,i.distanceToSquared(t[s]));return this.radius=Math.sqrt(n),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Es.subVectors(t,this.center);let e=Es.lengthSq();if(e>this.radius*this.radius){let i=Math.sqrt(e),n=(i-this.radius)*.5;this.center.addScaledVector(Es,n/i),this.radius+=n}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(lo.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Es.copy(t.center).add(lo)),this.expandByPoint(Es.copy(t.center).sub(lo))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},Wi=new P,co=new P,pr=new P,ln=new P,ho=new P,mr=new P,uo=new P,Ds=class{constructor(t=new P,e=new P(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Wi)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Wi.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Wi.copy(this.origin).addScaledVector(this.direction,e),Wi.distanceToSquared(t))}distanceSqToSegment(t,e,i,n){co.copy(t).add(e).multiplyScalar(.5),pr.copy(e).sub(t).normalize(),ln.copy(this.origin).sub(co);let s=t.distanceTo(e)*.5,r=-this.direction.dot(pr),o=ln.dot(this.direction),l=-ln.dot(pr),c=ln.lengthSq(),h=Math.abs(1-r*r),d,u,f,g;if(h>0)if(d=r*l-o,u=r*o-l,g=s*h,d>=0)if(u>=-g)if(u<=g){let y=1/h;d*=y,u*=y,f=d*(d+r*u+2*o)+u*(r*d+u+2*l)+c}else u=s,d=Math.max(0,-(r*u+o)),f=-d*d+u*(u+2*l)+c;else u=-s,d=Math.max(0,-(r*u+o)),f=-d*d+u*(u+2*l)+c;else u<=-g?(d=Math.max(0,-(-r*s+o)),u=d>0?-s:Math.min(Math.max(-s,-l),s),f=-d*d+u*(u+2*l)+c):u<=g?(d=0,u=Math.min(Math.max(-s,-l),s),f=u*(u+2*l)+c):(d=Math.max(0,-(r*s+o)),u=d>0?s:Math.min(Math.max(-s,-l),s),f=-d*d+u*(u+2*l)+c);else u=r>0?-s:s,d=Math.max(0,-(r*u+o)),f=-d*d+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),n&&n.copy(co).addScaledVector(pr,u),f}intersectSphere(t,e){Wi.subVectors(t.center,this.origin);let i=Wi.dot(this.direction),n=Wi.dot(Wi)-i*i,s=t.radius*t.radius;if(n>s)return null;let r=Math.sqrt(s-n),o=i-r,l=i+r;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){let i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,n,s,r,o,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(i=(t.min.x-u.x)*c,n=(t.max.x-u.x)*c):(i=(t.max.x-u.x)*c,n=(t.min.x-u.x)*c),h>=0?(s=(t.min.y-u.y)*h,r=(t.max.y-u.y)*h):(s=(t.max.y-u.y)*h,r=(t.min.y-u.y)*h),i>r||s>n||((s>i||isNaN(i))&&(i=s),(r<n||isNaN(n))&&(n=r),d>=0?(o=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(o=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),i>l||o>n)||((o>i||i!==i)&&(i=o),(l<n||n!==n)&&(n=l),n<0)?null:this.at(i>=0?i:n,e)}intersectsBox(t){return this.intersectBox(t,Wi)!==null}intersectTriangle(t,e,i,n,s){ho.subVectors(e,t),mr.subVectors(i,t),uo.crossVectors(ho,mr);let r=this.direction.dot(uo),o;if(r>0){if(n)return null;o=1}else if(r<0)o=-1,r=-r;else return null;ln.subVectors(this.origin,t);let l=o*this.direction.dot(mr.crossVectors(ln,mr));if(l<0)return null;let c=o*this.direction.dot(ho.cross(ln));if(c<0||l+c>r)return null;let h=-o*ln.dot(uo);return h<0?null:this.at(h/r,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Qt=class a{constructor(t,e,i,n,s,r,o,l,c,h,d,u,f,g,y,p){a.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,n,s,r,o,l,c,h,d,u,f,g,y,p)}set(t,e,i,n,s,r,o,l,c,h,d,u,f,g,y,p){let m=this.elements;return m[0]=t,m[4]=e,m[8]=i,m[12]=n,m[1]=s,m[5]=r,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=d,m[14]=u,m[3]=f,m[7]=g,m[11]=y,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new a().fromArray(this.elements)}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){let e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,i=t.elements,n=1/Xn.setFromMatrixColumn(t,0).length(),s=1/Xn.setFromMatrixColumn(t,1).length(),r=1/Xn.setFromMatrixColumn(t,2).length();return e[0]=i[0]*n,e[1]=i[1]*n,e[2]=i[2]*n,e[3]=0,e[4]=i[4]*s,e[5]=i[5]*s,e[6]=i[6]*s,e[7]=0,e[8]=i[8]*r,e[9]=i[9]*r,e[10]=i[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,i=t.x,n=t.y,s=t.z,r=Math.cos(i),o=Math.sin(i),l=Math.cos(n),c=Math.sin(n),h=Math.cos(s),d=Math.sin(s);if(t.order==="XYZ"){let u=r*h,f=r*d,g=o*h,y=o*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=f+g*c,e[5]=u-y*c,e[9]=-o*l,e[2]=y-u*c,e[6]=g+f*c,e[10]=r*l}else if(t.order==="YXZ"){let u=l*h,f=l*d,g=c*h,y=c*d;e[0]=u+y*o,e[4]=g*o-f,e[8]=r*c,e[1]=r*d,e[5]=r*h,e[9]=-o,e[2]=f*o-g,e[6]=y+u*o,e[10]=r*l}else if(t.order==="ZXY"){let u=l*h,f=l*d,g=c*h,y=c*d;e[0]=u-y*o,e[4]=-r*d,e[8]=g+f*o,e[1]=f+g*o,e[5]=r*h,e[9]=y-u*o,e[2]=-r*c,e[6]=o,e[10]=r*l}else if(t.order==="ZYX"){let u=r*h,f=r*d,g=o*h,y=o*d;e[0]=l*h,e[4]=g*c-f,e[8]=u*c+y,e[1]=l*d,e[5]=y*c+u,e[9]=f*c-g,e[2]=-c,e[6]=o*l,e[10]=r*l}else if(t.order==="YZX"){let u=r*l,f=r*c,g=o*l,y=o*c;e[0]=l*h,e[4]=y-u*d,e[8]=g*d+f,e[1]=d,e[5]=r*h,e[9]=-o*h,e[2]=-c*h,e[6]=f*d+g,e[10]=u-y*d}else if(t.order==="XZY"){let u=r*l,f=r*c,g=o*l,y=o*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+y,e[5]=r*h,e[9]=f*d-g,e[2]=g*d-f,e[6]=o*h,e[10]=y*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(ku,t,Pu)}lookAt(t,e,i){let n=this.elements;return pi.subVectors(t,e),pi.lengthSq()===0&&(pi.z=1),pi.normalize(),cn.crossVectors(i,pi),cn.lengthSq()===0&&(Math.abs(i.z)===1?pi.x+=1e-4:pi.z+=1e-4,pi.normalize(),cn.crossVectors(i,pi)),cn.normalize(),gr.crossVectors(pi,cn),n[0]=cn.x,n[4]=gr.x,n[8]=pi.x,n[1]=cn.y,n[5]=gr.y,n[9]=pi.y,n[2]=cn.z,n[6]=gr.z,n[10]=pi.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,n=e.elements,s=this.elements,r=i[0],o=i[4],l=i[8],c=i[12],h=i[1],d=i[5],u=i[9],f=i[13],g=i[2],y=i[6],p=i[10],m=i[14],x=i[3],v=i[7],b=i[11],_=i[15],A=n[0],T=n[4],k=n[8],D=n[12],w=n[1],M=n[5],L=n[9],U=n[13],H=n[2],Y=n[6],B=n[10],et=n[14],q=n[3],ht=n[7],it=n[11],ct=n[15];return s[0]=r*A+o*w+l*H+c*q,s[4]=r*T+o*M+l*Y+c*ht,s[8]=r*k+o*L+l*B+c*it,s[12]=r*D+o*U+l*et+c*ct,s[1]=h*A+d*w+u*H+f*q,s[5]=h*T+d*M+u*Y+f*ht,s[9]=h*k+d*L+u*B+f*it,s[13]=h*D+d*U+u*et+f*ct,s[2]=g*A+y*w+p*H+m*q,s[6]=g*T+y*M+p*Y+m*ht,s[10]=g*k+y*L+p*B+m*it,s[14]=g*D+y*U+p*et+m*ct,s[3]=x*A+v*w+b*H+_*q,s[7]=x*T+v*M+b*Y+_*ht,s[11]=x*k+v*L+b*B+_*it,s[15]=x*D+v*U+b*et+_*ct,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[4],n=t[8],s=t[12],r=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],f=t[14],g=t[3],y=t[7],p=t[11],m=t[15];return g*(+s*l*d-n*c*d-s*o*u+i*c*u+n*o*f-i*l*f)+y*(+e*l*f-e*c*u+s*r*u-n*r*f+n*c*h-s*l*h)+p*(+e*c*d-e*o*f-s*r*d+i*r*f+s*o*h-i*c*h)+m*(-n*o*h-e*l*d+e*o*u+n*r*d-i*r*u+i*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){let n=this.elements;return t.isVector3?(n[12]=t.x,n[13]=t.y,n[14]=t.z):(n[12]=t,n[13]=e,n[14]=i),this}invert(){let t=this.elements,e=t[0],i=t[1],n=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],f=t[11],g=t[12],y=t[13],p=t[14],m=t[15],x=d*p*c-y*u*c+y*l*f-o*p*f-d*l*m+o*u*m,v=g*u*c-h*p*c-g*l*f+r*p*f+h*l*m-r*u*m,b=h*y*c-g*d*c+g*o*f-r*y*f-h*o*m+r*d*m,_=g*d*l-h*y*l-g*o*u+r*y*u+h*o*p-r*d*p,A=e*x+i*v+n*b+s*_;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/A;return t[0]=x*T,t[1]=(y*u*s-d*p*s-y*n*f+i*p*f+d*n*m-i*u*m)*T,t[2]=(o*p*s-y*l*s+y*n*c-i*p*c-o*n*m+i*l*m)*T,t[3]=(d*l*s-o*u*s-d*n*c+i*u*c+o*n*f-i*l*f)*T,t[4]=v*T,t[5]=(h*p*s-g*u*s+g*n*f-e*p*f-h*n*m+e*u*m)*T,t[6]=(g*l*s-r*p*s-g*n*c+e*p*c+r*n*m-e*l*m)*T,t[7]=(r*u*s-h*l*s+h*n*c-e*u*c-r*n*f+e*l*f)*T,t[8]=b*T,t[9]=(g*d*s-h*y*s-g*i*f+e*y*f+h*i*m-e*d*m)*T,t[10]=(r*y*s-g*o*s+g*i*c-e*y*c-r*i*m+e*o*m)*T,t[11]=(h*o*s-r*d*s-h*i*c+e*d*c+r*i*f-e*o*f)*T,t[12]=_*T,t[13]=(h*y*n-g*d*n+g*i*u-e*y*u-h*i*p+e*d*p)*T,t[14]=(g*o*n-r*y*n-g*i*l+e*y*l+r*i*p-e*o*p)*T,t[15]=(r*d*n-h*o*n+h*i*l-e*d*l-r*i*u+e*o*u)*T,this}scale(t){let e=this.elements,i=t.x,n=t.y,s=t.z;return e[0]*=i,e[4]*=n,e[8]*=s,e[1]*=i,e[5]*=n,e[9]*=s,e[2]*=i,e[6]*=n,e[10]*=s,e[3]*=i,e[7]*=n,e[11]*=s,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],n=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,n))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let i=Math.cos(e),n=Math.sin(e),s=1-i,r=t.x,o=t.y,l=t.z,c=s*r,h=s*o;return this.set(c*r+i,c*o-n*l,c*l+n*o,0,c*o+n*l,h*o+i,h*l-n*r,0,c*l-n*o,h*l+n*r,s*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,n,s,r){return this.set(1,i,s,0,t,1,r,0,e,n,1,0,0,0,0,1),this}compose(t,e,i){let n=this.elements,s=e._x,r=e._y,o=e._z,l=e._w,c=s+s,h=r+r,d=o+o,u=s*c,f=s*h,g=s*d,y=r*h,p=r*d,m=o*d,x=l*c,v=l*h,b=l*d,_=i.x,A=i.y,T=i.z;return n[0]=(1-(y+m))*_,n[1]=(f+b)*_,n[2]=(g-v)*_,n[3]=0,n[4]=(f-b)*A,n[5]=(1-(u+m))*A,n[6]=(p+x)*A,n[7]=0,n[8]=(g+v)*T,n[9]=(p-x)*T,n[10]=(1-(u+y))*T,n[11]=0,n[12]=t.x,n[13]=t.y,n[14]=t.z,n[15]=1,this}decompose(t,e,i){let n=this.elements,s=Xn.set(n[0],n[1],n[2]).length(),r=Xn.set(n[4],n[5],n[6]).length(),o=Xn.set(n[8],n[9],n[10]).length();this.determinant()<0&&(s=-s),t.x=n[12],t.y=n[13],t.z=n[14],Ci.copy(this);let c=1/s,h=1/r,d=1/o;return Ci.elements[0]*=c,Ci.elements[1]*=c,Ci.elements[2]*=c,Ci.elements[4]*=h,Ci.elements[5]*=h,Ci.elements[6]*=h,Ci.elements[8]*=d,Ci.elements[9]*=d,Ci.elements[10]*=d,e.setFromRotationMatrix(Ci),i.x=s,i.y=r,i.z=o,this}makePerspective(t,e,i,n,s,r,o=Ki){let l=this.elements,c=2*s/(e-t),h=2*s/(i-n),d=(e+t)/(e-t),u=(i+n)/(i-n),f,g;if(o===Ki)f=-(r+s)/(r-s),g=-2*r*s/(r-s);else if(o===qr)f=-r/(r-s),g=-r*s/(r-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,n,s,r,o=Ki){let l=this.elements,c=1/(e-t),h=1/(i-n),d=1/(r-s),u=(e+t)*c,f=(i+n)*h,g,y;if(o===Ki)g=(r+s)*d,y=-2*d;else if(o===qr)g=s*d,y=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-u,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=y,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,i=t.elements;for(let n=0;n<16;n++)if(e[n]!==i[n])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}},Xn=new P,Ci=new Qt,ku=new P(0,0,0),Pu=new P(1,1,1),cn=new P,gr=new P,pi=new P,$c=new Qt,Yc=new ei,Be=class a{constructor(t=0,e=0,i=0,n=a.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=n}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,n=this._order){return this._x=t,this._y=e,this._z=i,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){let n=t.elements,s=n[0],r=n[4],o=n[8],l=n[1],c=n[5],h=n[9],d=n[2],u=n[6],f=n[10];switch(e){case"XYZ":this._y=Math.asin(ai(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-r,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ai(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(ai(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-ai(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(ai(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-ai(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return $c.makeRotationFromQuaternion(t),this.setFromRotationMatrix($c,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Yc.setFromEuler(this),this.setFromQuaternion(Yc,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Be.DEFAULT_ORDER="XYZ";var Ns=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Iu=0,jc=new P,$n=new ei,qi=new Qt,yr=new P,Ts=new P,Lu=new P,Du=new ei,Zc=new P(1,0,0),Kc=new P(0,1,0),Jc=new P(0,0,1),Qc={type:"added"},Nu={type:"removed"},Yn={type:"childadded",child:null},fo={type:"childremoved",child:null},Ne=class a extends pn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Iu++}),this.uuid=Hs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=a.DEFAULT_UP.clone();let t=new P,e=new Be,i=new ei,n=new P(1,1,1);function s(){i.setFromEuler(e,!1)}function r(){e.setFromQuaternion(i,void 0,!1)}e._onChange(s),i._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new Qt},normalMatrix:{value:new Zt}}),this.matrix=new Qt,this.matrixWorld=new Qt,this.matrixAutoUpdate=a.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=a.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ns,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return $n.setFromAxisAngle(t,e),this.quaternion.multiply($n),this}rotateOnWorldAxis(t,e){return $n.setFromAxisAngle(t,e),this.quaternion.premultiply($n),this}rotateX(t){return this.rotateOnAxis(Zc,t)}rotateY(t){return this.rotateOnAxis(Kc,t)}rotateZ(t){return this.rotateOnAxis(Jc,t)}translateOnAxis(t,e){return jc.copy(t).applyQuaternion(this.quaternion),this.position.add(jc.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Zc,t)}translateY(t){return this.translateOnAxis(Kc,t)}translateZ(t){return this.translateOnAxis(Jc,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(qi.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?yr.copy(t):yr.set(t,e,i);let n=this.parent;this.updateWorldMatrix(!0,!1),Ts.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?qi.lookAt(Ts,yr,this.up):qi.lookAt(yr,Ts,this.up),this.quaternion.setFromRotationMatrix(qi),n&&(qi.extractRotation(n.matrixWorld),$n.setFromRotationMatrix(qi),this.quaternion.premultiply($n.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Qc),Yn.child=t,this.dispatchEvent(Yn),Yn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Nu),fo.child=t,this.dispatchEvent(fo),fo.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),qi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),qi.multiply(t.parent.matrixWorld)),t.applyMatrix4(qi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Qc),Yn.child=t,this.dispatchEvent(Yn),Yn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,n=this.children.length;i<n;i++){let r=this.children[i].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);let n=this.children;for(let s=0,r=n.length;s<r;s++)n[s].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ts,t,Lu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ts,Du,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let n=this.children;for(let s=0,r=n.length;s<r;s++)n[s].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.visibility=this._visibility,n.active=this._active,n.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),n.maxInstanceCount=this._maxInstanceCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.geometryCount=this._geometryCount,n.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(n.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(n.boundingSphere={center:n.boundingSphere.center.toArray(),radius:n.boundingSphere.radius}),this.boundingBox!==null&&(n.boundingBox={min:n.boundingBox.min.toArray(),max:n.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=s(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];s(t.shapes,d)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(t.materials,this.material[l]));n.material=o}else n.material=s(t.materials,this.material);if(this.children.length>0){n.children=[];for(let o=0;o<this.children.length;o++)n.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){n.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];n.animations.push(s(t.animations,l))}}if(e){let o=r(t.geometries),l=r(t.materials),c=r(t.textures),h=r(t.images),d=r(t.shapes),u=r(t.skeletons),f=r(t.animations),g=r(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),u.length>0&&(i.skeletons=u),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=n,i;function r(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){let n=t.children[i];this.add(n.clone())}return this}};Ne.DEFAULT_UP=new P(0,1,0);Ne.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ne.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ki=new P,Xi=new P,po=new P,$i=new P,jn=new P,Zn=new P,th=new P,mo=new P,go=new P,yo=new P,xo=new ve,vo=new ve,bo=new ve,Cn=class a{constructor(t=new P,e=new P,i=new P){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,n){n.subVectors(i,e),ki.subVectors(t,e),n.cross(ki);let s=n.lengthSq();return s>0?n.multiplyScalar(1/Math.sqrt(s)):n.set(0,0,0)}static getBarycoord(t,e,i,n,s){ki.subVectors(n,e),Xi.subVectors(i,e),po.subVectors(t,e);let r=ki.dot(ki),o=ki.dot(Xi),l=ki.dot(po),c=Xi.dot(Xi),h=Xi.dot(po),d=r*c-o*o;if(d===0)return s.set(0,0,0),null;let u=1/d,f=(c*l-o*h)*u,g=(r*h-o*l)*u;return s.set(1-f-g,g,f)}static containsPoint(t,e,i,n){return this.getBarycoord(t,e,i,n,$i)===null?!1:$i.x>=0&&$i.y>=0&&$i.x+$i.y<=1}static getInterpolation(t,e,i,n,s,r,o,l){return this.getBarycoord(t,e,i,n,$i)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,$i.x),l.addScaledVector(r,$i.y),l.addScaledVector(o,$i.z),l)}static getInterpolatedAttribute(t,e,i,n,s,r){return xo.setScalar(0),vo.setScalar(0),bo.setScalar(0),xo.fromBufferAttribute(t,e),vo.fromBufferAttribute(t,i),bo.fromBufferAttribute(t,n),r.setScalar(0),r.addScaledVector(xo,s.x),r.addScaledVector(vo,s.y),r.addScaledVector(bo,s.z),r}static isFrontFacing(t,e,i,n){return ki.subVectors(i,e),Xi.subVectors(t,e),ki.cross(Xi).dot(n)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,n){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[n]),this}setFromAttributeAndIndices(t,e,i,n){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,n),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return ki.subVectors(this.c,this.b),Xi.subVectors(this.a,this.b),ki.cross(Xi).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return a.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return a.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,n,s){return a.getInterpolation(t,this.a,this.b,this.c,e,i,n,s)}containsPoint(t){return a.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return a.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let i=this.a,n=this.b,s=this.c,r,o;jn.subVectors(n,i),Zn.subVectors(s,i),mo.subVectors(t,i);let l=jn.dot(mo),c=Zn.dot(mo);if(l<=0&&c<=0)return e.copy(i);go.subVectors(t,n);let h=jn.dot(go),d=Zn.dot(go);if(h>=0&&d<=h)return e.copy(n);let u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return r=l/(l-h),e.copy(i).addScaledVector(jn,r);yo.subVectors(t,s);let f=jn.dot(yo),g=Zn.dot(yo);if(g>=0&&f<=g)return e.copy(s);let y=f*c-l*g;if(y<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(i).addScaledVector(Zn,o);let p=h*g-f*d;if(p<=0&&d-h>=0&&f-g>=0)return th.subVectors(s,n),o=(d-h)/(d-h+(f-g)),e.copy(n).addScaledVector(th,o);let m=1/(p+y+u);return r=y*m,o=u*m,e.copy(i).addScaledVector(jn,r).addScaledVector(Zn,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Qh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},hn={h:0,s:0,l:0},xr={h:0,s:0,l:0};function wo(a,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?a+(t-a)*6*e:e<1/2?t:e<2/3?a+(t-a)*6*(2/3-e):a}var mt=class{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){let n=t;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ye){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,me.toWorkingColorSpace(this,e),this}setRGB(t,e,i,n=me.workingColorSpace){return this.r=t,this.g=e,this.b=i,me.toWorkingColorSpace(this,n),this}setHSL(t,e,i,n=me.workingColorSpace){if(t=wu(t,1),e=ai(e,0,1),i=ai(i,0,1),e===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+e):i+e-i*e,r=2*i-s;this.r=wo(r,s,t+1/3),this.g=wo(r,s,t),this.b=wo(r,s,t-1/3)}return me.toWorkingColorSpace(this,n),this}setStyle(t,e=Ye){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(t)){let s,r=n[1],o=n[2];switch(r){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(t)){let s=n[1],r=s.length;if(r===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ye){let i=Qh[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=rs(t.r),this.g=rs(t.g),this.b=rs(t.b),this}copyLinearToSRGB(t){return this.r=so(t.r),this.g=so(t.g),this.b=so(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ye){return me.fromWorkingColorSpace($e.copy(this),t),Math.round(ai($e.r*255,0,255))*65536+Math.round(ai($e.g*255,0,255))*256+Math.round(ai($e.b*255,0,255))}getHexString(t=Ye){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=me.workingColorSpace){me.fromWorkingColorSpace($e.copy(this),e);let i=$e.r,n=$e.g,s=$e.b,r=Math.max(i,n,s),o=Math.min(i,n,s),l,c,h=(o+r)/2;if(o===r)l=0,c=0;else{let d=r-o;switch(c=h<=.5?d/(r+o):d/(2-r-o),r){case i:l=(n-s)/d+(n<s?6:0);break;case n:l=(s-i)/d+2;break;case s:l=(i-n)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=me.workingColorSpace){return me.fromWorkingColorSpace($e.copy(this),e),t.r=$e.r,t.g=$e.g,t.b=$e.b,t}getStyle(t=Ye){me.fromWorkingColorSpace($e.copy(this),t);let e=$e.r,i=$e.g,n=$e.b;return t!==Ye?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(n*255)})`}offsetHSL(t,e,i){return this.getHSL(hn),this.setHSL(hn.h+t,hn.s+e,hn.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(hn),t.getHSL(xr);let i=io(hn.h,xr.h,e),n=io(hn.s,xr.s,e),s=io(hn.l,xr.l,e);return this.setHSL(i,n,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,i=this.g,n=this.b,s=t.elements;return this.r=s[0]*e+s[3]*i+s[6]*n,this.g=s[1]*e+s[4]*i+s[7]*n,this.b=s[2]*e+s[5]*i+s[8]*n,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},$e=new mt;mt.NAMES=Qh;var zu=0,gn=class extends pn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:zu++}),this.uuid=Hs(),this.name="",this.type="Material",this.blending=ns,this.side=Ii,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Lo,this.blendDst=Do,this.blendEquation=Rn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new mt(0,0,0),this.blendAlpha=0,this.depthFunc=os,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Bc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Hn,this.stencilZFail=Hn,this.stencilZPass=Hn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let n=this[e];if(n===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(i):n&&n.isVector3&&i&&i.isVector3?n.copy(i):this[e]=i}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ns&&(i.blending=this.blending),this.side!==Ii&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Lo&&(i.blendSrc=this.blendSrc),this.blendDst!==Do&&(i.blendDst=this.blendDst),this.blendEquation!==Rn&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==os&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Bc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Hn&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Hn&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Hn&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function n(s){let r=[];for(let o in s){let l=s[o];delete l.metadata,r.push(l)}return r}if(e){let s=n(t.textures),r=n(t.images);s.length>0&&(i.textures=s),r.length>0&&(i.images=r)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,i=null;if(e!==null){let n=e.length;i=new Array(n);for(let s=0;s!==n;++s)i[s]=e[s].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Ce=class extends gn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new mt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Be,this.combine=Fh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var De=new P,vr=new Xt,de=class{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Hc,this.updateRanges=[],this.gpuType=Ui,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let n=0,s=this.itemSize;n<s;n++)this.array[t+n]=e.array[i+n];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)vr.fromBufferAttribute(this,e),vr.applyMatrix3(t),this.setXY(e,vr.x,vr.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)De.fromBufferAttribute(this,e),De.applyMatrix3(t),this.setXYZ(e,De.x,De.y,De.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)De.fromBufferAttribute(this,e),De.applyMatrix4(t),this.setXYZ(e,De.x,De.y,De.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)De.fromBufferAttribute(this,e),De.applyNormalMatrix(t),this.setXYZ(e,De.x,De.y,De.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)De.fromBufferAttribute(this,e),De.transformDirection(t),this.setXYZ(e,De.x,De.y,De.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=_s(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=ri(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=_s(e,this.array)),e}setX(t,e){return this.normalized&&(e=ri(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=_s(e,this.array)),e}setY(t,e){return this.normalized&&(e=ri(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=_s(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ri(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=_s(e,this.array)),e}setW(t,e){return this.normalized&&(e=ri(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=ri(e,this.array),i=ri(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,n){return t*=this.itemSize,this.normalized&&(e=ri(e,this.array),i=ri(i,this.array),n=ri(n,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=n,this}setXYZW(t,e,i,n,s){return t*=this.itemSize,this.normalized&&(e=ri(e,this.array),i=ri(i,this.array),n=ri(n,this.array),s=ri(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=n,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Hc&&(t.usage=this.usage),t}};var Zr=class extends de{constructor(t,e,i){super(new Uint16Array(t),e,i)}};var Kr=class extends de{constructor(t,e,i){super(new Uint32Array(t),e,i)}};var be=class extends de{constructor(t,e,i){super(new Float32Array(t),e,i)}},Uu=0,_i=new Qt,_o=new Ne,Kn=new P,mi=new Mi,As=new Mi,Fe=new P,ke=class a extends pn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Uu++}),this.uuid=Hs(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Jh(t)?Kr:Zr)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Zt().getNormalMatrix(t);i.applyNormalMatrix(s),i.needsUpdate=!0}let n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(t),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return _i.makeRotationFromQuaternion(t),this.applyMatrix4(_i),this}rotateX(t){return _i.makeRotationX(t),this.applyMatrix4(_i),this}rotateY(t){return _i.makeRotationY(t),this.applyMatrix4(_i),this}rotateZ(t){return _i.makeRotationZ(t),this.applyMatrix4(_i),this}translate(t,e,i){return _i.makeTranslation(t,e,i),this.applyMatrix4(_i),this}scale(t,e,i){return _i.makeScale(t,e,i),this.applyMatrix4(_i),this}lookAt(t){return _o.lookAt(t),_o.updateMatrix(),this.applyMatrix4(_o.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Kn).negate(),this.translate(Kn.x,Kn.y,Kn.z),this}setFromPoints(t){let e=[];for(let i=0,n=t.length;i<n;i++){let s=t[i];e.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new be(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Mi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,n=e.length;i<n;i++){let s=e[i];mi.setFromBufferAttribute(s),this.morphTargetsRelative?(Fe.addVectors(this.boundingBox.min,mi.min),this.boundingBox.expandByPoint(Fe),Fe.addVectors(this.boundingBox.max,mi.max),this.boundingBox.expandByPoint(Fe)):(this.boundingBox.expandByPoint(mi.min),this.boundingBox.expandByPoint(mi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new mn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(t){let i=this.boundingSphere.center;if(mi.setFromBufferAttribute(t),e)for(let s=0,r=e.length;s<r;s++){let o=e[s];As.setFromBufferAttribute(o),this.morphTargetsRelative?(Fe.addVectors(mi.min,As.min),mi.expandByPoint(Fe),Fe.addVectors(mi.max,As.max),mi.expandByPoint(Fe)):(mi.expandByPoint(As.min),mi.expandByPoint(As.max))}mi.getCenter(i);let n=0;for(let s=0,r=t.count;s<r;s++)Fe.fromBufferAttribute(t,s),n=Math.max(n,i.distanceToSquared(Fe));if(e)for(let s=0,r=e.length;s<r;s++){let o=e[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Fe.fromBufferAttribute(o,c),l&&(Kn.fromBufferAttribute(t,c),Fe.add(Kn)),n=Math.max(n,i.distanceToSquared(Fe))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=e.position,n=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new de(new Float32Array(4*i.count),4));let r=this.getAttribute("tangent"),o=[],l=[];for(let k=0;k<i.count;k++)o[k]=new P,l[k]=new P;let c=new P,h=new P,d=new P,u=new Xt,f=new Xt,g=new Xt,y=new P,p=new P;function m(k,D,w){c.fromBufferAttribute(i,k),h.fromBufferAttribute(i,D),d.fromBufferAttribute(i,w),u.fromBufferAttribute(s,k),f.fromBufferAttribute(s,D),g.fromBufferAttribute(s,w),h.sub(c),d.sub(c),f.sub(u),g.sub(u);let M=1/(f.x*g.y-g.x*f.y);isFinite(M)&&(y.copy(h).multiplyScalar(g.y).addScaledVector(d,-f.y).multiplyScalar(M),p.copy(d).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(M),o[k].add(y),o[D].add(y),o[w].add(y),l[k].add(p),l[D].add(p),l[w].add(p))}let x=this.groups;x.length===0&&(x=[{start:0,count:t.count}]);for(let k=0,D=x.length;k<D;++k){let w=x[k],M=w.start,L=w.count;for(let U=M,H=M+L;U<H;U+=3)m(t.getX(U+0),t.getX(U+1),t.getX(U+2))}let v=new P,b=new P,_=new P,A=new P;function T(k){_.fromBufferAttribute(n,k),A.copy(_);let D=o[k];v.copy(D),v.sub(_.multiplyScalar(_.dot(D))).normalize(),b.crossVectors(A,D);let M=b.dot(l[k])<0?-1:1;r.setXYZW(k,v.x,v.y,v.z,M)}for(let k=0,D=x.length;k<D;++k){let w=x[k],M=w.start,L=w.count;for(let U=M,H=M+L;U<H;U+=3)T(t.getX(U+0)),T(t.getX(U+1)),T(t.getX(U+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new de(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let u=0,f=i.count;u<f;u++)i.setXYZ(u,0,0,0);let n=new P,s=new P,r=new P,o=new P,l=new P,c=new P,h=new P,d=new P;if(t)for(let u=0,f=t.count;u<f;u+=3){let g=t.getX(u+0),y=t.getX(u+1),p=t.getX(u+2);n.fromBufferAttribute(e,g),s.fromBufferAttribute(e,y),r.fromBufferAttribute(e,p),h.subVectors(r,s),d.subVectors(n,s),h.cross(d),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,y),c.fromBufferAttribute(i,p),o.add(h),l.add(h),c.add(h),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(y,l.x,l.y,l.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,f=e.count;u<f;u+=3)n.fromBufferAttribute(e,u+0),s.fromBufferAttribute(e,u+1),r.fromBufferAttribute(e,u+2),h.subVectors(r,s),d.subVectors(n,s),h.cross(d),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Fe.fromBufferAttribute(t,e),Fe.normalize(),t.setXYZ(e,Fe.x,Fe.y,Fe.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h),f=0,g=0;for(let y=0,p=l.length;y<p;y++){o.isInterleavedBufferAttribute?f=l[y]*o.data.stride+o.offset:f=l[y]*h;for(let m=0;m<h;m++)u[g++]=c[f++]}return new de(u,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new a,i=this.index.array,n=this.attributes;for(let o in n){let l=n[o],c=t(l,i);e.setAttribute(o,c)}let s=this.morphAttributes;for(let o in s){let l=[],c=s[o];for(let h=0,d=c.length;h<d;h++){let u=c[h],f=t(u,i);l.push(f)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let o=0,l=r.length;o<l;o++){let c=r[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let n={},s=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){let f=c[d];h.push(f.toJSON(t.data))}h.length>0&&(n[l]=h,s=!0)}s&&(t.data.morphAttributes=n,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone(e));let n=t.attributes;for(let c in n){let h=n[c];this.setAttribute(c,h.clone(e))}let s=t.morphAttributes;for(let c in s){let h=[],d=s[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let c=0,h=r.length;c<h;c++){let d=r[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},eh=new Qt,Mn=new Ds,br=new mn,ih=new P,wr=new P,_r=new P,Mr=new P,Mo=new P,Sr=new P,nh=new P,Er=new P,At=class extends Ne{constructor(t=new ke,e=new Ce){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let n=e[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=n.length;s<r;s++){let o=n[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){let i=this.geometry,n=i.attributes.position,s=i.morphAttributes.position,r=i.morphTargetsRelative;e.fromBufferAttribute(n,t);let o=this.morphTargetInfluences;if(s&&o){Sr.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let h=o[l],d=s[l];h!==0&&(Mo.fromBufferAttribute(d,t),r?Sr.addScaledVector(Mo,h):Sr.addScaledVector(Mo.sub(e),h))}e.add(Sr)}return e}raycast(t,e){let i=this.geometry,n=this.material,s=this.matrixWorld;n!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),br.copy(i.boundingSphere),br.applyMatrix4(s),Mn.copy(t.ray).recast(t.near),!(br.containsPoint(Mn.origin)===!1&&(Mn.intersectSphere(br,ih)===null||Mn.origin.distanceToSquared(ih)>(t.far-t.near)**2))&&(eh.copy(s).invert(),Mn.copy(t.ray).applyMatrix4(eh),!(i.boundingBox!==null&&Mn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Mn)))}_computeIntersections(t,e,i){let n,s=this.geometry,r=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,d=s.attributes.normal,u=s.groups,f=s.drawRange;if(o!==null)if(Array.isArray(r))for(let g=0,y=u.length;g<y;g++){let p=u[g],m=r[p.materialIndex],x=Math.max(p.start,f.start),v=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let b=x,_=v;b<_;b+=3){let A=o.getX(b),T=o.getX(b+1),k=o.getX(b+2);n=Tr(this,m,t,i,c,h,d,A,T,k),n&&(n.faceIndex=Math.floor(b/3),n.face.materialIndex=p.materialIndex,e.push(n))}}else{let g=Math.max(0,f.start),y=Math.min(o.count,f.start+f.count);for(let p=g,m=y;p<m;p+=3){let x=o.getX(p),v=o.getX(p+1),b=o.getX(p+2);n=Tr(this,r,t,i,c,h,d,x,v,b),n&&(n.faceIndex=Math.floor(p/3),e.push(n))}}else if(l!==void 0)if(Array.isArray(r))for(let g=0,y=u.length;g<y;g++){let p=u[g],m=r[p.materialIndex],x=Math.max(p.start,f.start),v=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let b=x,_=v;b<_;b+=3){let A=b,T=b+1,k=b+2;n=Tr(this,m,t,i,c,h,d,A,T,k),n&&(n.faceIndex=Math.floor(b/3),n.face.materialIndex=p.materialIndex,e.push(n))}}else{let g=Math.max(0,f.start),y=Math.min(l.count,f.start+f.count);for(let p=g,m=y;p<m;p+=3){let x=p,v=p+1,b=p+2;n=Tr(this,r,t,i,c,h,d,x,v,b),n&&(n.faceIndex=Math.floor(p/3),e.push(n))}}}};function Ou(a,t,e,i,n,s,r,o){let l;if(t.side===Ze?l=i.intersectTriangle(r,s,n,!0,o):l=i.intersectTriangle(n,s,r,t.side===Ii,o),l===null)return null;Er.copy(o),Er.applyMatrix4(a.matrixWorld);let c=e.ray.origin.distanceTo(Er);return c<e.near||c>e.far?null:{distance:c,point:Er.clone(),object:a}}function Tr(a,t,e,i,n,s,r,o,l,c){a.getVertexPosition(o,wr),a.getVertexPosition(l,_r),a.getVertexPosition(c,Mr);let h=Ou(a,t,e,i,wr,_r,Mr,nh);if(h){let d=new P;Cn.getBarycoord(nh,wr,_r,Mr,d),n&&(h.uv=Cn.getInterpolatedAttribute(n,o,l,c,d,new Xt)),s&&(h.uv1=Cn.getInterpolatedAttribute(s,o,l,c,d,new Xt)),r&&(h.normal=Cn.getInterpolatedAttribute(r,o,l,c,d,new P),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new P,materialIndex:0};Cn.getNormal(wr,_r,Mr,u.normal),h.face=u,h.barycoord=d}return h}var Qi=class a extends ke{constructor(t=1,e=1,i=1,n=1,s=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:n,heightSegments:s,depthSegments:r};let o=this;n=Math.floor(n),s=Math.floor(s),r=Math.floor(r);let l=[],c=[],h=[],d=[],u=0,f=0;g("z","y","x",-1,-1,i,e,t,r,s,0),g("z","y","x",1,-1,i,e,-t,r,s,1),g("x","z","y",1,1,t,i,e,n,r,2),g("x","z","y",1,-1,t,i,-e,n,r,3),g("x","y","z",1,-1,t,e,i,n,s,4),g("x","y","z",-1,-1,t,e,-i,n,s,5),this.setIndex(l),this.setAttribute("position",new be(c,3)),this.setAttribute("normal",new be(h,3)),this.setAttribute("uv",new be(d,2));function g(y,p,m,x,v,b,_,A,T,k,D){let w=b/T,M=_/k,L=b/2,U=_/2,H=A/2,Y=T+1,B=k+1,et=0,q=0,ht=new P;for(let it=0;it<B;it++){let ct=it*M-U;for(let Wt=0;Wt<Y;Wt++){let Jt=Wt*w-L;ht[y]=Jt*x,ht[p]=ct*v,ht[m]=H,c.push(ht.x,ht.y,ht.z),ht[y]=0,ht[p]=0,ht[m]=A>0?1:-1,h.push(ht.x,ht.y,ht.z),d.push(Wt/T),d.push(1-it/k),et+=1}}for(let it=0;it<k;it++)for(let ct=0;ct<T;ct++){let Wt=u+ct+Y*it,Jt=u+ct+Y*(it+1),j=u+(ct+1)+Y*(it+1),nt=u+(ct+1)+Y*it;l.push(Wt,Jt,nt),l.push(Jt,j,nt),q+=6}o.addGroup(f,q,D),f+=q,u+=et}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new a(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function us(a){let t={};for(let e in a){t[e]={};for(let i in a[e]){let n=a[e][i];n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)?n.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=n.clone():Array.isArray(n)?t[e][i]=n.slice():t[e][i]=n}}return t}function ti(a){let t={};for(let e=0;e<a.length;e++){let i=us(a[e]);for(let n in i)t[n]=i[n]}return t}function Fu(a){let t=[];for(let e=0;e<a.length;e++)t.push(a[e].clone());return t}function td(a){let t=a.getRenderTarget();return t===null?a.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:me.workingColorSpace}var Bu={clone:us,merge:ti},Hu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Vu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Si=class extends gn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Hu,this.fragmentShader=Vu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=us(t.uniforms),this.uniformsGroups=Fu(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?e.uniforms[n]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?e.uniforms[n]={type:"c",value:r.getHex()}:r&&r.isVector2?e.uniforms[n]={type:"v2",value:r.toArray()}:r&&r.isVector3?e.uniforms[n]={type:"v3",value:r.toArray()}:r&&r.isVector4?e.uniforms[n]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?e.uniforms[n]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?e.uniforms[n]={type:"m4",value:r.toArray()}:e.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let i={};for(let n in this.extensions)this.extensions[n]===!0&&(i[n]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}},Jr=class extends Ne{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Qt,this.projectionMatrix=new Qt,this.projectionMatrixInverse=new Qt,this.coordinateSystem=Ki}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},dn=new P,sh=new Xt,rh=new Xt,Ge=class extends Jr{constructor(t=50,e=1,i=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=n,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Xr*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(eo*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Xr*2*Math.atan(Math.tan(eo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){dn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(dn.x,dn.y).multiplyScalar(-t/dn.z),dn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(dn.x,dn.y).multiplyScalar(-t/dn.z)}getViewSize(t,e){return this.getViewBounds(t,sh,rh),e.subVectors(rh,sh)}setViewOffset(t,e,i,n,s,r){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=n,this.view.width=s,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(eo*.5*this.fov)/this.zoom,i=2*e,n=this.aspect*i,s=-.5*n,r=this.view;if(this.view!==null&&this.view.enabled){let l=r.fullWidth,c=r.fullHeight;s+=r.offsetX*n/l,e-=r.offsetY*i/c,n*=r.width/l,i*=r.height/c}let o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+n,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Jn=-90,Qn=1,wl=class extends Ne{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let n=new Ge(Jn,Qn,t,e);n.layers=this.layers,this.add(n);let s=new Ge(Jn,Qn,t,e);s.layers=this.layers,this.add(s);let r=new Ge(Jn,Qn,t,e);r.layers=this.layers,this.add(r);let o=new Ge(Jn,Qn,t,e);o.layers=this.layers,this.add(o);let l=new Ge(Jn,Qn,t,e);l.layers=this.layers,this.add(l);let c=new Ge(Jn,Qn,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[i,n,s,r,o,l]=e;for(let c of e)this.remove(c);if(t===Ki)i.up.set(0,1,0),i.lookAt(1,0,0),n.up.set(0,1,0),n.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===qr)i.up.set(0,-1,0),i.lookAt(-1,0,0),n.up.set(0,-1,0),n.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:n}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[s,r,o,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let y=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,n),t.render(e,s),t.setRenderTarget(i,1,n),t.render(e,r),t.setRenderTarget(i,2,n),t.render(e,o),t.setRenderTarget(i,3,n),t.render(e,l),t.setRenderTarget(i,4,n),t.render(e,c),i.texture.generateMipmaps=y,t.setRenderTarget(i,5,n),t.render(e,h),t.setRenderTarget(d,u,f),t.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Qr=class extends yi{constructor(t,e,i,n,s,r,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:ls,super(t,e,i,n,s,r,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},_l=class extends Ji{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},n=[i,i,i,i,i,i];this.texture=new Qr(n,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:We}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},n=new Qi(5,5,5),s=new Si({name:"CubemapFromEquirect",uniforms:us(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ze,blending:un});s.uniforms.tEquirect.value=e;let r=new At(n,s),o=e.minFilter;return e.minFilter===Pi&&(e.minFilter=We),new wl(1,10,this).update(t,r),e.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,e,i,n){let s=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(e,i,n);t.setRenderTarget(s)}},So=new P,Gu=new P,Wu=new Zt,ji=class{constructor(t=new P(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,n){return this.normal.set(t,e,i),this.constant=n,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){let n=So.subVectors(i,e).cross(Gu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(n,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let i=t.delta(So),n=this.normal.dot(i);if(n===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let s=-(t.start.dot(this.normal)+this.constant)/n;return s<0||s>1?null:e.copy(t.start).addScaledVector(i,s)}intersectsLine(t){let e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let i=e||Wu.getNormalMatrix(t),n=this.coplanarPoint(So).applyMatrix4(t),s=this.normal.applyMatrix3(i).normalize();return this.constant=-n.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Sn=new mn,Ar=new P,zs=class{constructor(t=new ji,e=new ji,i=new ji,n=new ji,s=new ji,r=new ji){this.planes=[t,e,i,n,s,r]}set(t,e,i,n,s,r){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(i),o[3].copy(n),o[4].copy(s),o[5].copy(r),this}copy(t){let e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=Ki){let i=this.planes,n=t.elements,s=n[0],r=n[1],o=n[2],l=n[3],c=n[4],h=n[5],d=n[6],u=n[7],f=n[8],g=n[9],y=n[10],p=n[11],m=n[12],x=n[13],v=n[14],b=n[15];if(i[0].setComponents(l-s,u-c,p-f,b-m).normalize(),i[1].setComponents(l+s,u+c,p+f,b+m).normalize(),i[2].setComponents(l+r,u+h,p+g,b+x).normalize(),i[3].setComponents(l-r,u-h,p-g,b-x).normalize(),i[4].setComponents(l-o,u-d,p-y,b-v).normalize(),e===Ki)i[5].setComponents(l+o,u+d,p+y,b+v).normalize();else if(e===qr)i[5].setComponents(o,d,y,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Sn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Sn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Sn)}intersectsSprite(t){return Sn.center.set(0,0,0),Sn.radius=.7071067811865476,Sn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Sn)}intersectsSphere(t){let e=this.planes,i=t.center,n=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(i)<n)return!1;return!0}intersectsBox(t){let e=this.planes;for(let i=0;i<6;i++){let n=e[i];if(Ar.x=n.normal.x>0?t.max.x:t.min.x,Ar.y=n.normal.y>0?t.max.y:t.min.y,Ar.z=n.normal.z>0?t.max.z:t.min.z,n.distanceToPoint(Ar)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function ed(){let a=null,t=!1,e=null,i=null;function n(s,r){e(s,r),i=a.requestAnimationFrame(n)}return{start:function(){t!==!0&&e!==null&&(i=a.requestAnimationFrame(n),t=!0)},stop:function(){a.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){a=s}}}function qu(a){let t=new WeakMap;function e(o,l){let c=o.array,h=o.usage,d=c.byteLength,u=a.createBuffer();a.bindBuffer(l,u),a.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=a.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=a.HALF_FLOAT:f=a.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=a.SHORT;else if(c instanceof Uint32Array)f=a.UNSIGNED_INT;else if(c instanceof Int32Array)f=a.INT;else if(c instanceof Int8Array)f=a.BYTE;else if(c instanceof Uint8Array)f=a.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=a.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function i(o,l,c){let h=l.array,d=l.updateRanges;if(a.bindBuffer(c,o),d.length===0)a.bufferSubData(c,0,h);else{d.sort((f,g)=>f.start-g.start);let u=0;for(let f=1;f<d.length;f++){let g=d[u],y=d[f];y.start<=g.start+g.count+1?g.count=Math.max(g.count,y.start+y.count-g.start):(++u,d[u]=y)}d.length=u+1;for(let f=0,g=d.length;f<g;f++){let y=d[f];a.bufferSubData(c,y.start*h.BYTES_PER_ELEMENT,h,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function n(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(a.deleteBuffer(l.buffer),t.delete(o))}function r(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:n,remove:s,update:r}}var ze=class a extends ke{constructor(t=1,e=1,i=1,n=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:n};let s=t/2,r=e/2,o=Math.floor(i),l=Math.floor(n),c=o+1,h=l+1,d=t/o,u=e/l,f=[],g=[],y=[],p=[];for(let m=0;m<h;m++){let x=m*u-r;for(let v=0;v<c;v++){let b=v*d-s;g.push(b,-x,0),y.push(0,0,1),p.push(v/o),p.push(1-m/l)}}for(let m=0;m<l;m++)for(let x=0;x<o;x++){let v=x+c*m,b=x+c*(m+1),_=x+1+c*(m+1),A=x+1+c*m;f.push(v,b,A),f.push(b,_,A)}this.setIndex(f),this.setAttribute("position",new be(g,3)),this.setAttribute("normal",new be(y,3)),this.setAttribute("uv",new be(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new a(t.width,t.height,t.widthSegments,t.heightSegments)}},Xu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,$u=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Yu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ju=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ku=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ju=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Qu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,tf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,ef=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,nf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,sf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,rf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,af=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,of=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,lf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,cf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,hf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,df=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,uf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ff=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,pf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,mf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,gf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,yf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,xf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,vf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,bf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,wf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,_f=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Mf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Sf=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ef=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Tf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Af=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Rf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,kf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Pf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,If=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Lf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Df=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Nf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,zf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Uf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Of=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Ff=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Bf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Hf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Vf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Gf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Wf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,qf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Xf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,$f=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Yf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,jf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Zf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Kf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Jf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Qf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,tp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ep=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ip=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,np=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,sp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,rp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ap=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,op=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,lp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,cp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,dp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,up=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,pp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,mp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,gp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,yp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,xp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,vp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,bp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,wp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,_p=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Mp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Sp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ep=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Tp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ap=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Rp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Cp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,kp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Pp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Ip=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Lp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Dp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Np=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,zp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Up=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Op=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Fp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Bp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Hp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Vp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Wp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,qp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Xp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,$p=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,jp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Kp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Qp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,t0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,e0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,i0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,n0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,s0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,r0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,a0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,o0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,l0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,c0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,h0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,d0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,u0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,f0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,p0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,m0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,g0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,y0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,x0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,v0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,b0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,w0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,_0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,M0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,S0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,E0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,jt={alphahash_fragment:Xu,alphahash_pars_fragment:$u,alphamap_fragment:Yu,alphamap_pars_fragment:ju,alphatest_fragment:Zu,alphatest_pars_fragment:Ku,aomap_fragment:Ju,aomap_pars_fragment:Qu,batching_pars_vertex:tf,batching_vertex:ef,begin_vertex:nf,beginnormal_vertex:sf,bsdfs:rf,iridescence_fragment:af,bumpmap_pars_fragment:of,clipping_planes_fragment:lf,clipping_planes_pars_fragment:cf,clipping_planes_pars_vertex:hf,clipping_planes_vertex:df,color_fragment:uf,color_pars_fragment:ff,color_pars_vertex:pf,color_vertex:mf,common:gf,cube_uv_reflection_fragment:yf,defaultnormal_vertex:xf,displacementmap_pars_vertex:vf,displacementmap_vertex:bf,emissivemap_fragment:wf,emissivemap_pars_fragment:_f,colorspace_fragment:Mf,colorspace_pars_fragment:Sf,envmap_fragment:Ef,envmap_common_pars_fragment:Tf,envmap_pars_fragment:Af,envmap_pars_vertex:Rf,envmap_physical_pars_fragment:Ff,envmap_vertex:Cf,fog_vertex:kf,fog_pars_vertex:Pf,fog_fragment:If,fog_pars_fragment:Lf,gradientmap_pars_fragment:Df,lightmap_pars_fragment:Nf,lights_lambert_fragment:zf,lights_lambert_pars_fragment:Uf,lights_pars_begin:Of,lights_toon_fragment:Bf,lights_toon_pars_fragment:Hf,lights_phong_fragment:Vf,lights_phong_pars_fragment:Gf,lights_physical_fragment:Wf,lights_physical_pars_fragment:qf,lights_fragment_begin:Xf,lights_fragment_maps:$f,lights_fragment_end:Yf,logdepthbuf_fragment:jf,logdepthbuf_pars_fragment:Zf,logdepthbuf_pars_vertex:Kf,logdepthbuf_vertex:Jf,map_fragment:Qf,map_pars_fragment:tp,map_particle_fragment:ep,map_particle_pars_fragment:ip,metalnessmap_fragment:np,metalnessmap_pars_fragment:sp,morphinstance_vertex:rp,morphcolor_vertex:ap,morphnormal_vertex:op,morphtarget_pars_vertex:lp,morphtarget_vertex:cp,normal_fragment_begin:hp,normal_fragment_maps:dp,normal_pars_fragment:up,normal_pars_vertex:fp,normal_vertex:pp,normalmap_pars_fragment:mp,clearcoat_normal_fragment_begin:gp,clearcoat_normal_fragment_maps:yp,clearcoat_pars_fragment:xp,iridescence_pars_fragment:vp,opaque_fragment:bp,packing:wp,premultiplied_alpha_fragment:_p,project_vertex:Mp,dithering_fragment:Sp,dithering_pars_fragment:Ep,roughnessmap_fragment:Tp,roughnessmap_pars_fragment:Ap,shadowmap_pars_fragment:Rp,shadowmap_pars_vertex:Cp,shadowmap_vertex:kp,shadowmask_pars_fragment:Pp,skinbase_vertex:Ip,skinning_pars_vertex:Lp,skinning_vertex:Dp,skinnormal_vertex:Np,specularmap_fragment:zp,specularmap_pars_fragment:Up,tonemapping_fragment:Op,tonemapping_pars_fragment:Fp,transmission_fragment:Bp,transmission_pars_fragment:Hp,uv_pars_fragment:Vp,uv_pars_vertex:Gp,uv_vertex:Wp,worldpos_vertex:qp,background_vert:Xp,background_frag:$p,backgroundCube_vert:Yp,backgroundCube_frag:jp,cube_vert:Zp,cube_frag:Kp,depth_vert:Jp,depth_frag:Qp,distanceRGBA_vert:t0,distanceRGBA_frag:e0,equirect_vert:i0,equirect_frag:n0,linedashed_vert:s0,linedashed_frag:r0,meshbasic_vert:a0,meshbasic_frag:o0,meshlambert_vert:l0,meshlambert_frag:c0,meshmatcap_vert:h0,meshmatcap_frag:d0,meshnormal_vert:u0,meshnormal_frag:f0,meshphong_vert:p0,meshphong_frag:m0,meshphysical_vert:g0,meshphysical_frag:y0,meshtoon_vert:x0,meshtoon_frag:v0,points_vert:b0,points_frag:w0,shadow_vert:_0,shadow_frag:M0,sprite_vert:S0,sprite_frag:E0},dt={common:{diffuse:{value:new mt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Zt},alphaMap:{value:null},alphaMapTransform:{value:new Zt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Zt}},envmap:{envMap:{value:null},envMapRotation:{value:new Zt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Zt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Zt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Zt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Zt},normalScale:{value:new Xt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Zt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Zt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Zt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Zt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new mt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new mt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Zt},alphaTest:{value:0},uvTransform:{value:new Zt}},sprite:{diffuse:{value:new mt(16777215)},opacity:{value:1},center:{value:new Xt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Zt},alphaMap:{value:null},alphaMapTransform:{value:new Zt},alphaTest:{value:0}}},zi={basic:{uniforms:ti([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.fog]),vertexShader:jt.meshbasic_vert,fragmentShader:jt.meshbasic_frag},lambert:{uniforms:ti([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,dt.lights,{emissive:{value:new mt(0)}}]),vertexShader:jt.meshlambert_vert,fragmentShader:jt.meshlambert_frag},phong:{uniforms:ti([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,dt.lights,{emissive:{value:new mt(0)},specular:{value:new mt(1118481)},shininess:{value:30}}]),vertexShader:jt.meshphong_vert,fragmentShader:jt.meshphong_frag},standard:{uniforms:ti([dt.common,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.roughnessmap,dt.metalnessmap,dt.fog,dt.lights,{emissive:{value:new mt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:jt.meshphysical_vert,fragmentShader:jt.meshphysical_frag},toon:{uniforms:ti([dt.common,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.gradientmap,dt.fog,dt.lights,{emissive:{value:new mt(0)}}]),vertexShader:jt.meshtoon_vert,fragmentShader:jt.meshtoon_frag},matcap:{uniforms:ti([dt.common,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,{matcap:{value:null}}]),vertexShader:jt.meshmatcap_vert,fragmentShader:jt.meshmatcap_frag},points:{uniforms:ti([dt.points,dt.fog]),vertexShader:jt.points_vert,fragmentShader:jt.points_frag},dashed:{uniforms:ti([dt.common,dt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:jt.linedashed_vert,fragmentShader:jt.linedashed_frag},depth:{uniforms:ti([dt.common,dt.displacementmap]),vertexShader:jt.depth_vert,fragmentShader:jt.depth_frag},normal:{uniforms:ti([dt.common,dt.bumpmap,dt.normalmap,dt.displacementmap,{opacity:{value:1}}]),vertexShader:jt.meshnormal_vert,fragmentShader:jt.meshnormal_frag},sprite:{uniforms:ti([dt.sprite,dt.fog]),vertexShader:jt.sprite_vert,fragmentShader:jt.sprite_frag},background:{uniforms:{uvTransform:{value:new Zt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:jt.background_vert,fragmentShader:jt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Zt}},vertexShader:jt.backgroundCube_vert,fragmentShader:jt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:jt.cube_vert,fragmentShader:jt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:jt.equirect_vert,fragmentShader:jt.equirect_frag},distanceRGBA:{uniforms:ti([dt.common,dt.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:jt.distanceRGBA_vert,fragmentShader:jt.distanceRGBA_frag},shadow:{uniforms:ti([dt.lights,dt.fog,{color:{value:new mt(0)},opacity:{value:1}}]),vertexShader:jt.shadow_vert,fragmentShader:jt.shadow_frag}};zi.physical={uniforms:ti([zi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Zt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Zt},clearcoatNormalScale:{value:new Xt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Zt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Zt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Zt},sheen:{value:0},sheenColor:{value:new mt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Zt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Zt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Zt},transmissionSamplerSize:{value:new Xt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Zt},attenuationDistance:{value:0},attenuationColor:{value:new mt(0)},specularColor:{value:new mt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Zt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Zt},anisotropyVector:{value:new Xt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Zt}}]),vertexShader:jt.meshphysical_vert,fragmentShader:jt.meshphysical_frag};var Rr={r:0,b:0,g:0},En=new Be,T0=new Qt;function A0(a,t,e,i,n,s,r){let o=new mt(0),l=s===!0?0:1,c,h,d=null,u=0,f=null;function g(x){let v=x.isScene===!0?x.background:null;return v&&v.isTexture&&(v=(x.backgroundBlurriness>0?e:t).get(v)),v}function y(x){let v=!1,b=g(x);b===null?m(o,l):b&&b.isColor&&(m(b,1),v=!0);let _=a.xr.getEnvironmentBlendMode();_==="additive"?i.buffers.color.setClear(0,0,0,1,r):_==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,r),(a.autoClear||v)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),a.clear(a.autoClearColor,a.autoClearDepth,a.autoClearStencil))}function p(x,v){let b=g(v);b&&(b.isCubeTexture||b.mapping===pa)?(h===void 0&&(h=new At(new Qi(1,1,1),new Si({name:"BackgroundCubeMaterial",uniforms:us(zi.backgroundCube.uniforms),vertexShader:zi.backgroundCube.vertexShader,fragmentShader:zi.backgroundCube.fragmentShader,side:Ze,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(_,A,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(h)),En.copy(v.backgroundRotation),En.x*=-1,En.y*=-1,En.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(En.y*=-1,En.z*=-1),h.material.uniforms.envMap.value=b,h.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(T0.makeRotationFromEuler(En)),h.material.toneMapped=me.getTransfer(b.colorSpace)!==Te,(d!==b||u!==b.version||f!==a.toneMapping)&&(h.material.needsUpdate=!0,d=b,u=b.version,f=a.toneMapping),h.layers.enableAll(),x.unshift(h,h.geometry,h.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new At(new ze(2,2),new Si({name:"BackgroundMaterial",uniforms:us(zi.background.uniforms),vertexShader:zi.background.vertexShader,fragmentShader:zi.background.fragmentShader,side:Ii,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.toneMapped=me.getTransfer(b.colorSpace)!==Te,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(d!==b||u!==b.version||f!==a.toneMapping)&&(c.material.needsUpdate=!0,d=b,u=b.version,f=a.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null))}function m(x,v){x.getRGB(Rr,td(a)),i.buffers.color.setClear(Rr.r,Rr.g,Rr.b,v,r)}return{getClearColor:function(){return o},setClearColor:function(x,v=1){o.set(x),l=v,m(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(x){l=x,m(o,l)},render:y,addToRenderList:p}}function R0(a,t){let e=a.getParameter(a.MAX_VERTEX_ATTRIBS),i={},n=u(null),s=n,r=!1;function o(w,M,L,U,H){let Y=!1,B=d(U,L,M);s!==B&&(s=B,c(s.object)),Y=f(w,U,L,H),Y&&g(w,U,L,H),H!==null&&t.update(H,a.ELEMENT_ARRAY_BUFFER),(Y||r)&&(r=!1,b(w,M,L,U),H!==null&&a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,t.get(H).buffer))}function l(){return a.createVertexArray()}function c(w){return a.bindVertexArray(w)}function h(w){return a.deleteVertexArray(w)}function d(w,M,L){let U=L.wireframe===!0,H=i[w.id];H===void 0&&(H={},i[w.id]=H);let Y=H[M.id];Y===void 0&&(Y={},H[M.id]=Y);let B=Y[U];return B===void 0&&(B=u(l()),Y[U]=B),B}function u(w){let M=[],L=[],U=[];for(let H=0;H<e;H++)M[H]=0,L[H]=0,U[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:M,enabledAttributes:L,attributeDivisors:U,object:w,attributes:{},index:null}}function f(w,M,L,U){let H=s.attributes,Y=M.attributes,B=0,et=L.getAttributes();for(let q in et)if(et[q].location>=0){let it=H[q],ct=Y[q];if(ct===void 0&&(q==="instanceMatrix"&&w.instanceMatrix&&(ct=w.instanceMatrix),q==="instanceColor"&&w.instanceColor&&(ct=w.instanceColor)),it===void 0||it.attribute!==ct||ct&&it.data!==ct.data)return!0;B++}return s.attributesNum!==B||s.index!==U}function g(w,M,L,U){let H={},Y=M.attributes,B=0,et=L.getAttributes();for(let q in et)if(et[q].location>=0){let it=Y[q];it===void 0&&(q==="instanceMatrix"&&w.instanceMatrix&&(it=w.instanceMatrix),q==="instanceColor"&&w.instanceColor&&(it=w.instanceColor));let ct={};ct.attribute=it,it&&it.data&&(ct.data=it.data),H[q]=ct,B++}s.attributes=H,s.attributesNum=B,s.index=U}function y(){let w=s.newAttributes;for(let M=0,L=w.length;M<L;M++)w[M]=0}function p(w){m(w,0)}function m(w,M){let L=s.newAttributes,U=s.enabledAttributes,H=s.attributeDivisors;L[w]=1,U[w]===0&&(a.enableVertexAttribArray(w),U[w]=1),H[w]!==M&&(a.vertexAttribDivisor(w,M),H[w]=M)}function x(){let w=s.newAttributes,M=s.enabledAttributes;for(let L=0,U=M.length;L<U;L++)M[L]!==w[L]&&(a.disableVertexAttribArray(L),M[L]=0)}function v(w,M,L,U,H,Y,B){B===!0?a.vertexAttribIPointer(w,M,L,H,Y):a.vertexAttribPointer(w,M,L,U,H,Y)}function b(w,M,L,U){y();let H=U.attributes,Y=L.getAttributes(),B=M.defaultAttributeValues;for(let et in Y){let q=Y[et];if(q.location>=0){let ht=H[et];if(ht===void 0&&(et==="instanceMatrix"&&w.instanceMatrix&&(ht=w.instanceMatrix),et==="instanceColor"&&w.instanceColor&&(ht=w.instanceColor)),ht!==void 0){let it=ht.normalized,ct=ht.itemSize,Wt=t.get(ht);if(Wt===void 0)continue;let Jt=Wt.buffer,j=Wt.type,nt=Wt.bytesPerElement,ut=j===a.INT||j===a.UNSIGNED_INT||ht.gpuType===Ql;if(ht.isInterleavedBufferAttribute){let ft=ht.data,Nt=ft.stride,Ut=ht.offset;if(ft.isInstancedInterleavedBuffer){for(let ae=0;ae<q.locationSize;ae++)m(q.location+ae,ft.meshPerAttribute);w.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=ft.meshPerAttribute*ft.count)}else for(let ae=0;ae<q.locationSize;ae++)p(q.location+ae);a.bindBuffer(a.ARRAY_BUFFER,Jt);for(let ae=0;ae<q.locationSize;ae++)v(q.location+ae,ct/q.locationSize,j,it,Nt*nt,(Ut+ct/q.locationSize*ae)*nt,ut)}else{if(ht.isInstancedBufferAttribute){for(let ft=0;ft<q.locationSize;ft++)m(q.location+ft,ht.meshPerAttribute);w.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=ht.meshPerAttribute*ht.count)}else for(let ft=0;ft<q.locationSize;ft++)p(q.location+ft);a.bindBuffer(a.ARRAY_BUFFER,Jt);for(let ft=0;ft<q.locationSize;ft++)v(q.location+ft,ct/q.locationSize,j,it,ct*nt,ct/q.locationSize*ft*nt,ut)}}else if(B!==void 0){let it=B[et];if(it!==void 0)switch(it.length){case 2:a.vertexAttrib2fv(q.location,it);break;case 3:a.vertexAttrib3fv(q.location,it);break;case 4:a.vertexAttrib4fv(q.location,it);break;default:a.vertexAttrib1fv(q.location,it)}}}}x()}function _(){k();for(let w in i){let M=i[w];for(let L in M){let U=M[L];for(let H in U)h(U[H].object),delete U[H];delete M[L]}delete i[w]}}function A(w){if(i[w.id]===void 0)return;let M=i[w.id];for(let L in M){let U=M[L];for(let H in U)h(U[H].object),delete U[H];delete M[L]}delete i[w.id]}function T(w){for(let M in i){let L=i[M];if(L[w.id]===void 0)continue;let U=L[w.id];for(let H in U)h(U[H].object),delete U[H];delete L[w.id]}}function k(){D(),r=!0,s!==n&&(s=n,c(s.object))}function D(){n.geometry=null,n.program=null,n.wireframe=!1}return{setup:o,reset:k,resetDefaultState:D,dispose:_,releaseStatesOfGeometry:A,releaseStatesOfProgram:T,initAttributes:y,enableAttribute:p,disableUnusedAttributes:x}}function C0(a,t,e){let i;function n(c){i=c}function s(c,h){a.drawArrays(i,c,h),e.update(h,i,1)}function r(c,h,d){d!==0&&(a.drawArraysInstanced(i,c,h,d),e.update(h,i,d))}function o(c,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,d);let f=0;for(let g=0;g<d;g++)f+=h[g];e.update(f,i,1)}function l(c,h,d,u){if(d===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)r(c[g],h[g],u[g]);else{f.multiDrawArraysInstancedWEBGL(i,c,0,h,0,u,0,d);let g=0;for(let y=0;y<d;y++)g+=h[y];for(let y=0;y<u.length;y++)e.update(g,i,u[y])}}this.setMode=n,this.render=s,this.renderInstances=r,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function k0(a,t,e,i){let n;function s(){if(n!==void 0)return n;if(t.has("EXT_texture_filter_anisotropic")===!0){let T=t.get("EXT_texture_filter_anisotropic");n=a.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(T){return!(T!==je&&i.convert(T)!==a.getParameter(a.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){let k=T===Bs&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==li&&i.convert(T)!==a.getParameter(a.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==Ui&&!k)}function l(T){if(T==="highp"){if(a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.HIGH_FLOAT).precision>0&&a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.MEDIUM_FLOAT).precision>0&&a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=e.logarithmicDepthBuffer===!0,u=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control");if(u===!0){let T=t.get("EXT_clip_control");T.clipControlEXT(T.LOWER_LEFT_EXT,T.ZERO_TO_ONE_EXT)}let f=a.getParameter(a.MAX_TEXTURE_IMAGE_UNITS),g=a.getParameter(a.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=a.getParameter(a.MAX_TEXTURE_SIZE),p=a.getParameter(a.MAX_CUBE_MAP_TEXTURE_SIZE),m=a.getParameter(a.MAX_VERTEX_ATTRIBS),x=a.getParameter(a.MAX_VERTEX_UNIFORM_VECTORS),v=a.getParameter(a.MAX_VARYING_VECTORS),b=a.getParameter(a.MAX_FRAGMENT_UNIFORM_VECTORS),_=g>0,A=a.getParameter(a.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:u,maxTextures:f,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:x,maxVaryings:v,maxFragmentUniforms:b,vertexTextures:_,maxSamples:A}}function P0(a){let t=this,e=null,i=0,n=!1,s=!1,r=new ji,o=new Zt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let f=d.length!==0||u||i!==0||n;return n=u,i=d.length,f},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,f){let g=d.clippingPlanes,y=d.clipIntersection,p=d.clipShadows,m=a.get(d);if(!n||g===null||g.length===0||s&&!p)s?h(null):c();else{let x=s?0:i,v=x*4,b=m.clippingState||null;l.value=b,b=h(g,u,v,f);for(let _=0;_!==v;++_)b[_]=e[_];m.clippingState=b,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=x}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(d,u,f,g){let y=d!==null?d.length:0,p=null;if(y!==0){if(p=l.value,g!==!0||p===null){let m=f+y*4,x=u.matrixWorldInverse;o.getNormalMatrix(x),(p===null||p.length<m)&&(p=new Float32Array(m));for(let v=0,b=f;v!==y;++v,b+=4)r.copy(d[v]).applyMatrix4(x,o),r.normal.toArray(p,b),p[b+3]=r.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,p}}function I0(a){let t=new WeakMap;function e(r,o){return o===Vo?r.mapping=ls:o===Go&&(r.mapping=cs),r}function i(r){if(r&&r.isTexture){let o=r.mapping;if(o===Vo||o===Go)if(t.has(r)){let l=t.get(r).texture;return e(l,r.mapping)}else{let l=r.image;if(l&&l.height>0){let c=new _l(l.height);return c.fromEquirectangularTexture(a,r),t.set(r,c),r.addEventListener("dispose",n),e(c.texture,r.mapping)}else return null}}return r}function n(r){let o=r.target;o.removeEventListener("dispose",n);let l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function s(){t=new WeakMap}return{get:i,dispose:s}}var ta=class extends Jr{constructor(t=-1,e=1,i=1,n=-1,s=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=n,this.near=s,this.far=r,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,n,s,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=n,this.view.width=s,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,n=(this.top+this.bottom)/2,s=i-t,r=i+t,o=n+e,l=n-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,r=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,r,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},is=4,ah=[.125,.215,.35,.446,.526,.582],kn=20,Eo=new ta,oh=new mt,To=null,Ao=0,Ro=0,Co=!1,An=(1+Math.sqrt(5))/2,ts=1/An,lh=[new P(-An,ts,0),new P(An,ts,0),new P(-ts,0,An),new P(ts,0,An),new P(0,An,-ts),new P(0,An,ts),new P(-1,1,-1),new P(1,1,-1),new P(-1,1,1),new P(1,1,1)],ea=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,n=100){To=this._renderer.getRenderTarget(),Ao=this._renderer.getActiveCubeFace(),Ro=this._renderer.getActiveMipmapLevel(),Co=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,i,n,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=dh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=hh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(To,Ao,Ro),this._renderer.xr.enabled=Co,t.scissorTest=!1,Cr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===ls||t.mapping===cs?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),To=this._renderer.getRenderTarget(),Ao=this._renderer.getActiveCubeFace(),Ro=this._renderer.getActiveMipmapLevel(),Co=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:We,minFilter:We,generateMipmaps:!1,type:Bs,format:je,colorSpace:xn,depthBuffer:!1},n=ch(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ch(t,e,i);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=L0(s)),this._blurMaterial=D0(s,t,e)}return n}_compileMaterial(t){let e=new At(this._lodPlanes[0],t);this._renderer.compile(e,Eo)}_sceneToCubeUV(t,e,i,n){let o=new Ge(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,u=h.toneMapping;h.getClearColor(oh),h.toneMapping=fn,h.autoClear=!1;let f=new Ce({name:"PMREM.Background",side:Ze,depthWrite:!1,depthTest:!1}),g=new At(new Qi,f),y=!1,p=t.background;p?p.isColor&&(f.color.copy(p),t.background=null,y=!0):(f.color.copy(oh),y=!0);for(let m=0;m<6;m++){let x=m%3;x===0?(o.up.set(0,l[m],0),o.lookAt(c[m],0,0)):x===1?(o.up.set(0,0,l[m]),o.lookAt(0,c[m],0)):(o.up.set(0,l[m],0),o.lookAt(0,0,c[m]));let v=this._cubeSize;Cr(n,x*v,m>2?v:0,v,v),h.setRenderTarget(n),y&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=u,h.autoClear=d,t.background=p}_textureToCubeUV(t,e){let i=this._renderer,n=t.mapping===ls||t.mapping===cs;n?(this._cubemapMaterial===null&&(this._cubemapMaterial=dh()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=hh());let s=n?this._cubemapMaterial:this._equirectMaterial,r=new At(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=t;let l=this._cubeSize;Cr(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(r,Eo)}_applyPMREM(t){let e=this._renderer,i=e.autoClear;e.autoClear=!1;let n=this._lodPlanes.length;for(let s=1;s<n;s++){let r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=lh[(n-s-1)%lh.length];this._blur(t,s-1,s,r,o)}e.autoClear=i}_blur(t,e,i,n,s){let r=this._pingPongRenderTarget;this._halfBlur(t,r,e,i,n,"latitudinal",s),this._halfBlur(r,t,i,i,n,"longitudinal",s)}_halfBlur(t,e,i,n,s,r,o){let l=this._renderer,c=this._blurMaterial;r!=="latitudinal"&&r!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,d=new At(this._lodPlanes[n],c),u=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*kn-1),y=s/g,p=isFinite(s)?1+Math.floor(h*y):kn;p>kn&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${kn}`);let m=[],x=0;for(let T=0;T<kn;++T){let k=T/y,D=Math.exp(-k*k/2);m.push(D),T===0?x+=D:T<p&&(x+=2*D)}for(let T=0;T<m.length;T++)m[T]=m[T]/x;u.envMap.value=t.texture,u.samples.value=p,u.weights.value=m,u.latitudinal.value=r==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:v}=this;u.dTheta.value=g,u.mipInt.value=v-i;let b=this._sizeLods[n],_=3*b*(n>v-is?n-v+is:0),A=4*(this._cubeSize-b);Cr(e,_,A,3*b,2*b),l.setRenderTarget(e),l.render(d,Eo)}};function L0(a){let t=[],e=[],i=[],n=a,s=a-is+1+ah.length;for(let r=0;r<s;r++){let o=Math.pow(2,n);e.push(o);let l=1/o;r>a-is?l=ah[r-a+is-1]:r===0&&(l=0),i.push(l);let c=1/(o-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,g=6,y=3,p=2,m=1,x=new Float32Array(y*g*f),v=new Float32Array(p*g*f),b=new Float32Array(m*g*f);for(let A=0;A<f;A++){let T=A%3*2/3-1,k=A>2?0:-1,D=[T,k,0,T+2/3,k,0,T+2/3,k+1,0,T,k,0,T+2/3,k+1,0,T,k+1,0];x.set(D,y*g*A),v.set(u,p*g*A);let w=[A,A,A,A,A,A];b.set(w,m*g*A)}let _=new ke;_.setAttribute("position",new de(x,y)),_.setAttribute("uv",new de(v,p)),_.setAttribute("faceIndex",new de(b,m)),t.push(_),n>is&&n--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function ch(a,t,e){let i=new Ji(a,t,e);return i.texture.mapping=pa,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Cr(a,t,e,i,n){a.viewport.set(t,e,i,n),a.scissor.set(t,e,i,n)}function D0(a,t,e){let i=new Float32Array(kn),n=new P(0,1,0);return new Si({name:"SphericalGaussianBlur",defines:{n:kn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:n}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function hh(){return new Si({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function dh(){return new Si({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function oc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function N0(a){let t=new WeakMap,e=null;function i(o){if(o&&o.isTexture){let l=o.mapping,c=l===Vo||l===Go,h=l===ls||l===cs;if(c||h){let d=t.get(o),u=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==u)return e===null&&(e=new ea(a)),d=c?e.fromEquirectangular(o,d):e.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),d.texture;if(d!==void 0)return d.texture;{let f=o.image;return c&&f&&f.height>0||h&&f&&n(f)?(e===null&&(e=new ea(a)),d=c?e.fromEquirectangular(o):e.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),o.addEventListener("dispose",s),d.texture):null}}}return o}function n(o){let l=0,c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function s(o){let l=o.target;l.removeEventListener("dispose",s);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function r(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:r}}function z0(a){let t={};function e(i){if(t[i]!==void 0)return t[i];let n;switch(i){case"WEBGL_depth_texture":n=a.getExtension("WEBGL_depth_texture")||a.getExtension("MOZ_WEBGL_depth_texture")||a.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":n=a.getExtension("EXT_texture_filter_anisotropic")||a.getExtension("MOZ_EXT_texture_filter_anisotropic")||a.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":n=a.getExtension("WEBGL_compressed_texture_s3tc")||a.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||a.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":n=a.getExtension("WEBGL_compressed_texture_pvrtc")||a.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:n=a.getExtension(i)}return t[i]=n,n}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){let n=e(i);return n===null&&Br("THREE.WebGLRenderer: "+i+" extension not supported."),n}}}function U0(a,t,e,i){let n={},s=new WeakMap;function r(d){let u=d.target;u.index!==null&&t.remove(u.index);for(let g in u.attributes)t.remove(u.attributes[g]);for(let g in u.morphAttributes){let y=u.morphAttributes[g];for(let p=0,m=y.length;p<m;p++)t.remove(y[p])}u.removeEventListener("dispose",r),delete n[u.id];let f=s.get(u);f&&(t.remove(f),s.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(d,u){return n[u.id]===!0||(u.addEventListener("dispose",r),n[u.id]=!0,e.memory.geometries++),u}function l(d){let u=d.attributes;for(let g in u)t.update(u[g],a.ARRAY_BUFFER);let f=d.morphAttributes;for(let g in f){let y=f[g];for(let p=0,m=y.length;p<m;p++)t.update(y[p],a.ARRAY_BUFFER)}}function c(d){let u=[],f=d.index,g=d.attributes.position,y=0;if(f!==null){let x=f.array;y=f.version;for(let v=0,b=x.length;v<b;v+=3){let _=x[v+0],A=x[v+1],T=x[v+2];u.push(_,A,A,T,T,_)}}else if(g!==void 0){let x=g.array;y=g.version;for(let v=0,b=x.length/3-1;v<b;v+=3){let _=v+0,A=v+1,T=v+2;u.push(_,A,A,T,T,_)}}else return;let p=new(Jh(u)?Kr:Zr)(u,1);p.version=y;let m=s.get(d);m&&t.remove(m),s.set(d,p)}function h(d){let u=s.get(d);if(u){let f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return s.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function O0(a,t,e){let i;function n(u){i=u}let s,r;function o(u){s=u.type,r=u.bytesPerElement}function l(u,f){a.drawElements(i,f,s,u*r),e.update(f,i,1)}function c(u,f,g){g!==0&&(a.drawElementsInstanced(i,f,s,u*r,g),e.update(f,i,g))}function h(u,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,s,u,0,g);let p=0;for(let m=0;m<g;m++)p+=f[m];e.update(p,i,1)}function d(u,f,g,y){if(g===0)return;let p=t.get("WEBGL_multi_draw");if(p===null)for(let m=0;m<u.length;m++)c(u[m]/r,f[m],y[m]);else{p.multiDrawElementsInstancedWEBGL(i,f,0,s,u,0,y,0,g);let m=0;for(let x=0;x<g;x++)m+=f[x];for(let x=0;x<y.length;x++)e.update(m,i,y[x])}}this.setMode=n,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function F0(a){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,r,o){switch(e.calls++,r){case a.TRIANGLES:e.triangles+=o*(s/3);break;case a.LINES:e.lines+=o*(s/2);break;case a.LINE_STRIP:e.lines+=o*(s-1);break;case a.LINE_LOOP:e.lines+=o*s;break;case a.POINTS:e.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",r);break}}function n(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:n,update:i}}function B0(a,t,e){let i=new WeakMap,n=new ve;function s(r,o,l){let c=r.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0,u=i.get(o);if(u===void 0||u.count!==d){let D=function(){T.dispose(),i.delete(o),o.removeEventListener("dispose",D)};u!==void 0&&u.texture.dispose();let f=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],x=o.morphAttributes.color||[],v=0;f===!0&&(v=1),g===!0&&(v=2),y===!0&&(v=3);let b=o.attributes.position.count*v,_=1;b>t.maxTextureSize&&(_=Math.ceil(b/t.maxTextureSize),b=t.maxTextureSize);let A=new Float32Array(b*_*4*d),T=new jr(A,b,_,d);T.type=Ui,T.needsUpdate=!0;let k=v*4;for(let w=0;w<d;w++){let M=p[w],L=m[w],U=x[w],H=b*_*4*w;for(let Y=0;Y<M.count;Y++){let B=Y*k;f===!0&&(n.fromBufferAttribute(M,Y),A[H+B+0]=n.x,A[H+B+1]=n.y,A[H+B+2]=n.z,A[H+B+3]=0),g===!0&&(n.fromBufferAttribute(L,Y),A[H+B+4]=n.x,A[H+B+5]=n.y,A[H+B+6]=n.z,A[H+B+7]=0),y===!0&&(n.fromBufferAttribute(U,Y),A[H+B+8]=n.x,A[H+B+9]=n.y,A[H+B+10]=n.z,A[H+B+11]=U.itemSize===4?n.w:1)}}u={count:d,texture:T,size:new Xt(b,_)},i.set(o,u),o.addEventListener("dispose",D)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(a,"morphTexture",r.morphTexture,e);else{let f=0;for(let y=0;y<c.length;y++)f+=c[y];let g=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(a,"morphTargetBaseInfluence",g),l.getUniforms().setValue(a,"morphTargetInfluences",c)}l.getUniforms().setValue(a,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(a,"morphTargetsTextureSize",u.size)}return{update:s}}function H0(a,t,e,i){let n=new WeakMap;function s(l){let c=i.render.frame,h=l.geometry,d=t.get(l,h);if(n.get(d)!==c&&(t.update(d),n.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),n.get(l)!==c&&(e.update(l.instanceMatrix,a.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,a.ARRAY_BUFFER),n.set(l,c))),l.isSkinnedMesh){let u=l.skeleton;n.get(u)!==c&&(u.update(),n.set(u,c))}return d}function r(){n=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:s,dispose:r}}var ia=class extends yi{constructor(t,e,i,n,s,r,o,l,c,h=ss){if(h!==ss&&h!==ds)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===ss&&(i=In),i===void 0&&h===ds&&(i=hs),super(null,n,s,r,o,l,h,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:oi,this.minFilter=l!==void 0?l:oi,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},id=new yi,uh=new ia(1,1),nd=new jr,sd=new bl,rd=new Qr,fh=[],ph=[],mh=new Float32Array(16),gh=new Float32Array(9),yh=new Float32Array(4);function gs(a,t,e){let i=a[0];if(i<=0||i>0)return a;let n=t*e,s=fh[n];if(s===void 0&&(s=new Float32Array(n),fh[n]=s),t!==0){i.toArray(s,0);for(let r=1,o=0;r!==t;++r)o+=e,a[r].toArray(s,o)}return s}function Ue(a,t){if(a.length!==t.length)return!1;for(let e=0,i=a.length;e<i;e++)if(a[e]!==t[e])return!1;return!0}function Oe(a,t){for(let e=0,i=t.length;e<i;e++)a[e]=t[e]}function ga(a,t){let e=ph[t];e===void 0&&(e=new Int32Array(t),ph[t]=e);for(let i=0;i!==t;++i)e[i]=a.allocateTextureUnit();return e}function V0(a,t){let e=this.cache;e[0]!==t&&(a.uniform1f(this.addr,t),e[0]=t)}function G0(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;a.uniform2fv(this.addr,t),Oe(e,t)}}function W0(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(a.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ue(e,t))return;a.uniform3fv(this.addr,t),Oe(e,t)}}function q0(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;a.uniform4fv(this.addr,t),Oe(e,t)}}function X0(a,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ue(e,t))return;a.uniformMatrix2fv(this.addr,!1,t),Oe(e,t)}else{if(Ue(e,i))return;yh.set(i),a.uniformMatrix2fv(this.addr,!1,yh),Oe(e,i)}}function $0(a,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ue(e,t))return;a.uniformMatrix3fv(this.addr,!1,t),Oe(e,t)}else{if(Ue(e,i))return;gh.set(i),a.uniformMatrix3fv(this.addr,!1,gh),Oe(e,i)}}function Y0(a,t){let e=this.cache,i=t.elements;if(i===void 0){if(Ue(e,t))return;a.uniformMatrix4fv(this.addr,!1,t),Oe(e,t)}else{if(Ue(e,i))return;mh.set(i),a.uniformMatrix4fv(this.addr,!1,mh),Oe(e,i)}}function j0(a,t){let e=this.cache;e[0]!==t&&(a.uniform1i(this.addr,t),e[0]=t)}function Z0(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;a.uniform2iv(this.addr,t),Oe(e,t)}}function K0(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ue(e,t))return;a.uniform3iv(this.addr,t),Oe(e,t)}}function J0(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;a.uniform4iv(this.addr,t),Oe(e,t)}}function Q0(a,t){let e=this.cache;e[0]!==t&&(a.uniform1ui(this.addr,t),e[0]=t)}function tm(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;a.uniform2uiv(this.addr,t),Oe(e,t)}}function em(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ue(e,t))return;a.uniform3uiv(this.addr,t),Oe(e,t)}}function im(a,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;a.uniform4uiv(this.addr,t),Oe(e,t)}}function nm(a,t,e){let i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n);let s;this.type===a.SAMPLER_2D_SHADOW?(uh.compareFunction=Kh,s=uh):s=id,e.setTexture2D(t||s,n)}function sm(a,t,e){let i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),e.setTexture3D(t||sd,n)}function rm(a,t,e){let i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),e.setTextureCube(t||rd,n)}function am(a,t,e){let i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),e.setTexture2DArray(t||nd,n)}function om(a){switch(a){case 5126:return V0;case 35664:return G0;case 35665:return W0;case 35666:return q0;case 35674:return X0;case 35675:return $0;case 35676:return Y0;case 5124:case 35670:return j0;case 35667:case 35671:return Z0;case 35668:case 35672:return K0;case 35669:case 35673:return J0;case 5125:return Q0;case 36294:return tm;case 36295:return em;case 36296:return im;case 35678:case 36198:case 36298:case 36306:case 35682:return nm;case 35679:case 36299:case 36307:return sm;case 35680:case 36300:case 36308:case 36293:return rm;case 36289:case 36303:case 36311:case 36292:return am}}function lm(a,t){a.uniform1fv(this.addr,t)}function cm(a,t){let e=gs(t,this.size,2);a.uniform2fv(this.addr,e)}function hm(a,t){let e=gs(t,this.size,3);a.uniform3fv(this.addr,e)}function dm(a,t){let e=gs(t,this.size,4);a.uniform4fv(this.addr,e)}function um(a,t){let e=gs(t,this.size,4);a.uniformMatrix2fv(this.addr,!1,e)}function fm(a,t){let e=gs(t,this.size,9);a.uniformMatrix3fv(this.addr,!1,e)}function pm(a,t){let e=gs(t,this.size,16);a.uniformMatrix4fv(this.addr,!1,e)}function mm(a,t){a.uniform1iv(this.addr,t)}function gm(a,t){a.uniform2iv(this.addr,t)}function ym(a,t){a.uniform3iv(this.addr,t)}function xm(a,t){a.uniform4iv(this.addr,t)}function vm(a,t){a.uniform1uiv(this.addr,t)}function bm(a,t){a.uniform2uiv(this.addr,t)}function wm(a,t){a.uniform3uiv(this.addr,t)}function _m(a,t){a.uniform4uiv(this.addr,t)}function Mm(a,t,e){let i=this.cache,n=t.length,s=ga(e,n);Ue(i,s)||(a.uniform1iv(this.addr,s),Oe(i,s));for(let r=0;r!==n;++r)e.setTexture2D(t[r]||id,s[r])}function Sm(a,t,e){let i=this.cache,n=t.length,s=ga(e,n);Ue(i,s)||(a.uniform1iv(this.addr,s),Oe(i,s));for(let r=0;r!==n;++r)e.setTexture3D(t[r]||sd,s[r])}function Em(a,t,e){let i=this.cache,n=t.length,s=ga(e,n);Ue(i,s)||(a.uniform1iv(this.addr,s),Oe(i,s));for(let r=0;r!==n;++r)e.setTextureCube(t[r]||rd,s[r])}function Tm(a,t,e){let i=this.cache,n=t.length,s=ga(e,n);Ue(i,s)||(a.uniform1iv(this.addr,s),Oe(i,s));for(let r=0;r!==n;++r)e.setTexture2DArray(t[r]||nd,s[r])}function Am(a){switch(a){case 5126:return lm;case 35664:return cm;case 35665:return hm;case 35666:return dm;case 35674:return um;case 35675:return fm;case 35676:return pm;case 5124:case 35670:return mm;case 35667:case 35671:return gm;case 35668:case 35672:return ym;case 35669:case 35673:return xm;case 5125:return vm;case 36294:return bm;case 36295:return wm;case 36296:return _m;case 35678:case 36198:case 36298:case 36306:case 35682:return Mm;case 35679:case 36299:case 36307:return Sm;case 35680:case 36300:case 36308:case 36293:return Em;case 36289:case 36303:case 36311:case 36292:return Tm}}var Ml=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=om(e.type)}},Sl=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Am(e.type)}},El=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){let n=this.seq;for(let s=0,r=n.length;s!==r;++s){let o=n[s];o.setValue(t,e[o.id],i)}}},ko=/(\w+)(\])?(\[|\.)?/g;function xh(a,t){a.seq.push(t),a.map[t.id]=t}function Rm(a,t,e){let i=a.name,n=i.length;for(ko.lastIndex=0;;){let s=ko.exec(i),r=ko.lastIndex,o=s[1],l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&r+2===n){xh(e,c===void 0?new Ml(o,a,t):new Sl(o,a,t));break}else{let d=e.map[o];d===void 0&&(d=new El(o),xh(e,d)),e=d}}}var as=class{constructor(t,e){this.seq=[],this.map={};let i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let n=0;n<i;++n){let s=t.getActiveUniform(e,n),r=t.getUniformLocation(e,s.name);Rm(s,r,this)}}setValue(t,e,i,n){let s=this.map[e];s!==void 0&&s.setValue(t,i,n)}setOptional(t,e,i){let n=e[i];n!==void 0&&this.setValue(t,i,n)}static upload(t,e,i,n){for(let s=0,r=e.length;s!==r;++s){let o=e[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,n)}}static seqWithValue(t,e){let i=[];for(let n=0,s=t.length;n!==s;++n){let r=t[n];r.id in e&&i.push(r)}return i}};function vh(a,t,e){let i=a.createShader(t);return a.shaderSource(i,e),a.compileShader(i),i}var Cm=37297,km=0;function Pm(a,t){let e=a.split(`
`),i=[],n=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let r=n;r<s;r++){let o=r+1;i.push(`${o===t?">":" "} ${o}: ${e[r]}`)}return i.join(`
`)}function Im(a){let t=me.getPrimaries(me.workingColorSpace),e=me.getPrimaries(a),i;switch(t===e?i="":t===Wr&&e===Gr?i="LinearDisplayP3ToLinearSRGB":t===Gr&&e===Wr&&(i="LinearSRGBToLinearDisplayP3"),a){case xn:case ma:return[i,"LinearTransferOETF"];case Ye:case ac:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",a),[i,"LinearTransferOETF"]}}function bh(a,t,e){let i=a.getShaderParameter(t,a.COMPILE_STATUS),n=a.getShaderInfoLog(t).trim();if(i&&n==="")return"";let s=/ERROR: 0:(\d+)/.exec(n);if(s){let r=parseInt(s[1]);return e.toUpperCase()+`

`+n+`

`+Pm(a.getShaderSource(t),r)}else return n}function Lm(a,t){let e=Im(t);return`vec4 ${a}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function Dm(a,t){let e;switch(t){case su:e="Linear";break;case ru:e="Reinhard";break;case au:e="Cineon";break;case Jl:e="ACESFilmic";break;case lu:e="AgX";break;case cu:e="Neutral";break;case ou:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+a+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var kr=new P;function Nm(){me.getLuminanceCoefficients(kr);let a=kr.x.toFixed(4),t=kr.y.toFixed(4),e=kr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${a}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function zm(a){return[a.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",a.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ps).join(`
`)}function Um(a){let t=[];for(let e in a){let i=a[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function Om(a,t){let e={},i=a.getProgramParameter(t,a.ACTIVE_ATTRIBUTES);for(let n=0;n<i;n++){let s=a.getActiveAttrib(t,n),r=s.name,o=1;s.type===a.FLOAT_MAT2&&(o=2),s.type===a.FLOAT_MAT3&&(o=3),s.type===a.FLOAT_MAT4&&(o=4),e[r]={type:s.type,location:a.getAttribLocation(t,r),locationSize:o}}return e}function Ps(a){return a!==""}function wh(a,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return a.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function _h(a,t){return a.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Fm=/^[ \t]*#include +<([\w\d./]+)>/gm;function Tl(a){return a.replace(Fm,Hm)}var Bm=new Map;function Hm(a,t){let e=jt[t];if(e===void 0){let i=Bm.get(t);if(i!==void 0)e=jt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return Tl(e)}var Vm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Mh(a){return a.replace(Vm,Gm)}function Gm(a,t,e,i){let n="";for(let s=parseInt(t);s<parseInt(e);s++)n+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return n}function Sh(a){let t=`precision ${a.precision} float;
	precision ${a.precision} int;
	precision ${a.precision} sampler2D;
	precision ${a.precision} samplerCube;
	precision ${a.precision} sampler3D;
	precision ${a.precision} sampler2DArray;
	precision ${a.precision} sampler2DShadow;
	precision ${a.precision} samplerCubeShadow;
	precision ${a.precision} sampler2DArrayShadow;
	precision ${a.precision} isampler2D;
	precision ${a.precision} isampler3D;
	precision ${a.precision} isamplerCube;
	precision ${a.precision} isampler2DArray;
	precision ${a.precision} usampler2D;
	precision ${a.precision} usampler3D;
	precision ${a.precision} usamplerCube;
	precision ${a.precision} usampler2DArray;
	`;return a.precision==="highp"?t+=`
#define HIGH_PRECISION`:a.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:a.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Wm(a){let t="SHADOWMAP_TYPE_BASIC";return a.shadowMapType===Oh?t="SHADOWMAP_TYPE_PCF":a.shadowMapType===Kl?t="SHADOWMAP_TYPE_PCF_SOFT":a.shadowMapType===Yi&&(t="SHADOWMAP_TYPE_VSM"),t}function qm(a){let t="ENVMAP_TYPE_CUBE";if(a.envMap)switch(a.envMapMode){case ls:case cs:t="ENVMAP_TYPE_CUBE";break;case pa:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Xm(a){let t="ENVMAP_MODE_REFLECTION";if(a.envMap)switch(a.envMapMode){case cs:t="ENVMAP_MODE_REFRACTION";break}return t}function $m(a){let t="ENVMAP_BLENDING_NONE";if(a.envMap)switch(a.combine){case Fh:t="ENVMAP_BLENDING_MULTIPLY";break;case iu:t="ENVMAP_BLENDING_MIX";break;case nu:t="ENVMAP_BLENDING_ADD";break}return t}function Ym(a){let t=a.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:i,maxMip:e}}function jm(a,t,e,i){let n=a.getContext(),s=e.defines,r=e.vertexShader,o=e.fragmentShader,l=Wm(e),c=qm(e),h=Xm(e),d=$m(e),u=Ym(e),f=zm(e),g=Um(s),y=n.createProgram(),p,m,x=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ps).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ps).join(`
`),m.length>0&&(m+=`
`)):(p=[Sh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ps).join(`
`),m=[Sh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==fn?"#define TONE_MAPPING":"",e.toneMapping!==fn?jt.tonemapping_pars_fragment:"",e.toneMapping!==fn?Dm("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",jt.colorspace_pars_fragment,Lm("linearToOutputTexel",e.outputColorSpace),Nm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ps).join(`
`)),r=Tl(r),r=wh(r,e),r=_h(r,e),o=Tl(o),o=wh(o,e),o=_h(o,e),r=Mh(r),o=Mh(o),e.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",e.glslVersion===Vc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Vc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let v=x+p+r,b=x+m+o,_=vh(n,n.VERTEX_SHADER,v),A=vh(n,n.FRAGMENT_SHADER,b);n.attachShader(y,_),n.attachShader(y,A),e.index0AttributeName!==void 0?n.bindAttribLocation(y,0,e.index0AttributeName):e.morphTargets===!0&&n.bindAttribLocation(y,0,"position"),n.linkProgram(y);function T(M){if(a.debug.checkShaderErrors){let L=n.getProgramInfoLog(y).trim(),U=n.getShaderInfoLog(_).trim(),H=n.getShaderInfoLog(A).trim(),Y=!0,B=!0;if(n.getProgramParameter(y,n.LINK_STATUS)===!1)if(Y=!1,typeof a.debug.onShaderError=="function")a.debug.onShaderError(n,y,_,A);else{let et=bh(n,_,"vertex"),q=bh(n,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+n.getError()+" - VALIDATE_STATUS "+n.getProgramParameter(y,n.VALIDATE_STATUS)+`

Material Name: `+M.name+`
Material Type: `+M.type+`

Program Info Log: `+L+`
`+et+`
`+q)}else L!==""?console.warn("THREE.WebGLProgram: Program Info Log:",L):(U===""||H==="")&&(B=!1);B&&(M.diagnostics={runnable:Y,programLog:L,vertexShader:{log:U,prefix:p},fragmentShader:{log:H,prefix:m}})}n.deleteShader(_),n.deleteShader(A),k=new as(n,y),D=Om(n,y)}let k;this.getUniforms=function(){return k===void 0&&T(this),k};let D;this.getAttributes=function(){return D===void 0&&T(this),D};let w=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return w===!1&&(w=n.getProgramParameter(y,Cm)),w},this.destroy=function(){i.releaseStatesOfProgram(this),n.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=km++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=_,this.fragmentShader=A,this}var Zm=0,Al=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,i=t.fragmentShader,n=this._getShaderStage(e),s=this._getShaderStage(i),r=this._getShaderCacheForMaterial(t);return r.has(n)===!1&&(r.add(n),n.usedTimes++),r.has(s)===!1&&(r.add(s),s.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){let e=this.shaderCache,i=e.get(t);return i===void 0&&(i=new Rl(t),e.set(t,i)),i}},Rl=class{constructor(t){this.id=Zm++,this.code=t,this.usedTimes=0}};function Km(a,t,e,i,n,s,r){let o=new Ns,l=new Al,c=new Set,h=[],d=n.logarithmicDepthBuffer,u=n.reverseDepthBuffer,f=n.vertexTextures,g=n.precision,y={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(w){return c.add(w),w===0?"uv":`uv${w}`}function m(w,M,L,U,H){let Y=U.fog,B=H.geometry,et=w.isMeshStandardMaterial?U.environment:null,q=(w.isMeshStandardMaterial?e:t).get(w.envMap||et),ht=q&&q.mapping===pa?q.image.height:null,it=y[w.type];w.precision!==null&&(g=n.getMaxPrecision(w.precision),g!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",g,"instead."));let ct=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Wt=ct!==void 0?ct.length:0,Jt=0;B.morphAttributes.position!==void 0&&(Jt=1),B.morphAttributes.normal!==void 0&&(Jt=2),B.morphAttributes.color!==void 0&&(Jt=3);let j,nt,ut,ft;if(it){let si=zi[it];j=si.vertexShader,nt=si.fragmentShader}else j=w.vertexShader,nt=w.fragmentShader,l.update(w),ut=l.getVertexShaderID(w),ft=l.getFragmentShaderID(w);let Nt=a.getRenderTarget(),Ut=H.isInstancedMesh===!0,ae=H.isBatchedMesh===!0,xe=!!w.map,oe=!!w.matcap,N=!!q,di=!!w.aoMap,ne=!!w.lightMap,ce=!!w.bumpMap,Ht=!!w.normalMap,Se=!!w.displacementMap,qt=!!w.emissiveMap,I=!!w.metalnessMap,S=!!w.roughnessMap,V=w.anisotropy>0,Q=w.clearcoat>0,st=w.dispersion>0,K=w.iridescence>0,It=w.sheen>0,pt=w.transmission>0,St=V&&!!w.anisotropyMap,he=Q&&!!w.clearcoatMap,at=Q&&!!w.clearcoatNormalMap,Et=Q&&!!w.clearcoatRoughnessMap,Vt=K&&!!w.iridescenceMap,Gt=K&&!!w.iridescenceThicknessMap,Tt=It&&!!w.sheenColorMap,se=It&&!!w.sheenRoughnessMap,Yt=!!w.specularMap,we=!!w.specularColorMap,z=!!w.specularIntensityMap,wt=pt&&!!w.transmissionMap,$=pt&&!!w.thicknessMap,tt=!!w.gradientMap,yt=!!w.alphaMap,_t=w.alphaTest>0,le=!!w.alphaHash,Le=!!w.extensions,ni=fn;w.toneMapped&&(Nt===null||Nt.isXRRenderTarget===!0)&&(ni=a.toneMapping);let ue={shaderID:it,shaderType:w.type,shaderName:w.name,vertexShader:j,fragmentShader:nt,defines:w.defines,customVertexShaderID:ut,customFragmentShaderID:ft,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:g,batching:ae,batchingColor:ae&&H._colorsTexture!==null,instancing:Ut,instancingColor:Ut&&H.instanceColor!==null,instancingMorph:Ut&&H.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:Nt===null?a.outputColorSpace:Nt.isXRRenderTarget===!0?Nt.texture.colorSpace:xn,alphaToCoverage:!!w.alphaToCoverage,map:xe,matcap:oe,envMap:N,envMapMode:N&&q.mapping,envMapCubeUVHeight:ht,aoMap:di,lightMap:ne,bumpMap:ce,normalMap:Ht,displacementMap:f&&Se,emissiveMap:qt,normalMapObjectSpace:Ht&&w.normalMapType===fu,normalMapTangentSpace:Ht&&w.normalMapType===Zh,metalnessMap:I,roughnessMap:S,anisotropy:V,anisotropyMap:St,clearcoat:Q,clearcoatMap:he,clearcoatNormalMap:at,clearcoatRoughnessMap:Et,dispersion:st,iridescence:K,iridescenceMap:Vt,iridescenceThicknessMap:Gt,sheen:It,sheenColorMap:Tt,sheenRoughnessMap:se,specularMap:Yt,specularColorMap:we,specularIntensityMap:z,transmission:pt,transmissionMap:wt,thicknessMap:$,gradientMap:tt,opaque:w.transparent===!1&&w.blending===ns&&w.alphaToCoverage===!1,alphaMap:yt,alphaTest:_t,alphaHash:le,combine:w.combine,mapUv:xe&&p(w.map.channel),aoMapUv:di&&p(w.aoMap.channel),lightMapUv:ne&&p(w.lightMap.channel),bumpMapUv:ce&&p(w.bumpMap.channel),normalMapUv:Ht&&p(w.normalMap.channel),displacementMapUv:Se&&p(w.displacementMap.channel),emissiveMapUv:qt&&p(w.emissiveMap.channel),metalnessMapUv:I&&p(w.metalnessMap.channel),roughnessMapUv:S&&p(w.roughnessMap.channel),anisotropyMapUv:St&&p(w.anisotropyMap.channel),clearcoatMapUv:he&&p(w.clearcoatMap.channel),clearcoatNormalMapUv:at&&p(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Et&&p(w.clearcoatRoughnessMap.channel),iridescenceMapUv:Vt&&p(w.iridescenceMap.channel),iridescenceThicknessMapUv:Gt&&p(w.iridescenceThicknessMap.channel),sheenColorMapUv:Tt&&p(w.sheenColorMap.channel),sheenRoughnessMapUv:se&&p(w.sheenRoughnessMap.channel),specularMapUv:Yt&&p(w.specularMap.channel),specularColorMapUv:we&&p(w.specularColorMap.channel),specularIntensityMapUv:z&&p(w.specularIntensityMap.channel),transmissionMapUv:wt&&p(w.transmissionMap.channel),thicknessMapUv:$&&p(w.thicknessMap.channel),alphaMapUv:yt&&p(w.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(Ht||V),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!B.attributes.uv&&(xe||yt),fog:!!Y,useFog:w.fog===!0,fogExp2:!!Y&&Y.isFogExp2,flatShading:w.flatShading===!0,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:u,skinning:H.isSkinnedMesh===!0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:Wt,morphTextureStride:Jt,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:w.dithering,shadowMapEnabled:a.shadowMap.enabled&&L.length>0,shadowMapType:a.shadowMap.type,toneMapping:ni,decodeVideoTexture:xe&&w.map.isVideoTexture===!0&&me.getTransfer(w.map.colorSpace)===Te,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===_e,flipSided:w.side===Ze,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:Le&&w.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Le&&w.extensions.multiDraw===!0||ae)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return ue.vertexUv1s=c.has(1),ue.vertexUv2s=c.has(2),ue.vertexUv3s=c.has(3),c.clear(),ue}function x(w){let M=[];if(w.shaderID?M.push(w.shaderID):(M.push(w.customVertexShaderID),M.push(w.customFragmentShaderID)),w.defines!==void 0)for(let L in w.defines)M.push(L),M.push(w.defines[L]);return w.isRawShaderMaterial===!1&&(v(M,w),b(M,w),M.push(a.outputColorSpace)),M.push(w.customProgramCacheKey),M.join()}function v(w,M){w.push(M.precision),w.push(M.outputColorSpace),w.push(M.envMapMode),w.push(M.envMapCubeUVHeight),w.push(M.mapUv),w.push(M.alphaMapUv),w.push(M.lightMapUv),w.push(M.aoMapUv),w.push(M.bumpMapUv),w.push(M.normalMapUv),w.push(M.displacementMapUv),w.push(M.emissiveMapUv),w.push(M.metalnessMapUv),w.push(M.roughnessMapUv),w.push(M.anisotropyMapUv),w.push(M.clearcoatMapUv),w.push(M.clearcoatNormalMapUv),w.push(M.clearcoatRoughnessMapUv),w.push(M.iridescenceMapUv),w.push(M.iridescenceThicknessMapUv),w.push(M.sheenColorMapUv),w.push(M.sheenRoughnessMapUv),w.push(M.specularMapUv),w.push(M.specularColorMapUv),w.push(M.specularIntensityMapUv),w.push(M.transmissionMapUv),w.push(M.thicknessMapUv),w.push(M.combine),w.push(M.fogExp2),w.push(M.sizeAttenuation),w.push(M.morphTargetsCount),w.push(M.morphAttributeCount),w.push(M.numDirLights),w.push(M.numPointLights),w.push(M.numSpotLights),w.push(M.numSpotLightMaps),w.push(M.numHemiLights),w.push(M.numRectAreaLights),w.push(M.numDirLightShadows),w.push(M.numPointLightShadows),w.push(M.numSpotLightShadows),w.push(M.numSpotLightShadowsWithMaps),w.push(M.numLightProbes),w.push(M.shadowMapType),w.push(M.toneMapping),w.push(M.numClippingPlanes),w.push(M.numClipIntersection),w.push(M.depthPacking)}function b(w,M){o.disableAll(),M.supportsVertexTextures&&o.enable(0),M.instancing&&o.enable(1),M.instancingColor&&o.enable(2),M.instancingMorph&&o.enable(3),M.matcap&&o.enable(4),M.envMap&&o.enable(5),M.normalMapObjectSpace&&o.enable(6),M.normalMapTangentSpace&&o.enable(7),M.clearcoat&&o.enable(8),M.iridescence&&o.enable(9),M.alphaTest&&o.enable(10),M.vertexColors&&o.enable(11),M.vertexAlphas&&o.enable(12),M.vertexUv1s&&o.enable(13),M.vertexUv2s&&o.enable(14),M.vertexUv3s&&o.enable(15),M.vertexTangents&&o.enable(16),M.anisotropy&&o.enable(17),M.alphaHash&&o.enable(18),M.batching&&o.enable(19),M.dispersion&&o.enable(20),M.batchingColor&&o.enable(21),w.push(o.mask),o.disableAll(),M.fog&&o.enable(0),M.useFog&&o.enable(1),M.flatShading&&o.enable(2),M.logarithmicDepthBuffer&&o.enable(3),M.reverseDepthBuffer&&o.enable(4),M.skinning&&o.enable(5),M.morphTargets&&o.enable(6),M.morphNormals&&o.enable(7),M.morphColors&&o.enable(8),M.premultipliedAlpha&&o.enable(9),M.shadowMapEnabled&&o.enable(10),M.doubleSided&&o.enable(11),M.flipSided&&o.enable(12),M.useDepthPacking&&o.enable(13),M.dithering&&o.enable(14),M.transmission&&o.enable(15),M.sheen&&o.enable(16),M.opaque&&o.enable(17),M.pointsUvs&&o.enable(18),M.decodeVideoTexture&&o.enable(19),M.alphaToCoverage&&o.enable(20),w.push(o.mask)}function _(w){let M=y[w.type],L;if(M){let U=zi[M];L=Bu.clone(U.uniforms)}else L=w.uniforms;return L}function A(w,M){let L;for(let U=0,H=h.length;U<H;U++){let Y=h[U];if(Y.cacheKey===M){L=Y,++L.usedTimes;break}}return L===void 0&&(L=new jm(a,M,w,s),h.push(L)),L}function T(w){if(--w.usedTimes===0){let M=h.indexOf(w);h[M]=h[h.length-1],h.pop(),w.destroy()}}function k(w){l.remove(w)}function D(){l.dispose()}return{getParameters:m,getProgramCacheKey:x,getUniforms:_,acquireProgram:A,releaseProgram:T,releaseShaderCache:k,programs:h,dispose:D}}function Jm(){let a=new WeakMap;function t(r){return a.has(r)}function e(r){let o=a.get(r);return o===void 0&&(o={},a.set(r,o)),o}function i(r){a.delete(r)}function n(r,o,l){a.get(r)[o]=l}function s(){a=new WeakMap}return{has:t,get:e,remove:i,update:n,dispose:s}}function Qm(a,t){return a.groupOrder!==t.groupOrder?a.groupOrder-t.groupOrder:a.renderOrder!==t.renderOrder?a.renderOrder-t.renderOrder:a.material.id!==t.material.id?a.material.id-t.material.id:a.z!==t.z?a.z-t.z:a.id-t.id}function Eh(a,t){return a.groupOrder!==t.groupOrder?a.groupOrder-t.groupOrder:a.renderOrder!==t.renderOrder?a.renderOrder-t.renderOrder:a.z!==t.z?t.z-a.z:a.id-t.id}function Th(){let a=[],t=0,e=[],i=[],n=[];function s(){t=0,e.length=0,i.length=0,n.length=0}function r(d,u,f,g,y,p){let m=a[t];return m===void 0?(m={id:d.id,object:d,geometry:u,material:f,groupOrder:g,renderOrder:d.renderOrder,z:y,group:p},a[t]=m):(m.id=d.id,m.object=d,m.geometry=u,m.material=f,m.groupOrder=g,m.renderOrder=d.renderOrder,m.z=y,m.group=p),t++,m}function o(d,u,f,g,y,p){let m=r(d,u,f,g,y,p);f.transmission>0?i.push(m):f.transparent===!0?n.push(m):e.push(m)}function l(d,u,f,g,y,p){let m=r(d,u,f,g,y,p);f.transmission>0?i.unshift(m):f.transparent===!0?n.unshift(m):e.unshift(m)}function c(d,u){e.length>1&&e.sort(d||Qm),i.length>1&&i.sort(u||Eh),n.length>1&&n.sort(u||Eh)}function h(){for(let d=t,u=a.length;d<u;d++){let f=a[d];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:i,transparent:n,init:s,push:o,unshift:l,finish:h,sort:c}}function tg(){let a=new WeakMap;function t(i,n){let s=a.get(i),r;return s===void 0?(r=new Th,a.set(i,[r])):n>=s.length?(r=new Th,s.push(r)):r=s[n],r}function e(){a=new WeakMap}return{get:t,dispose:e}}function eg(){let a={};return{get:function(t){if(a[t.id]!==void 0)return a[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new P,color:new mt};break;case"SpotLight":e={position:new P,direction:new P,color:new mt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new P,color:new mt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new P,skyColor:new mt,groundColor:new mt};break;case"RectAreaLight":e={color:new mt,position:new P,halfWidth:new P,halfHeight:new P};break}return a[t.id]=e,e}}}function ig(){let a={};return{get:function(t){if(a[t.id]!==void 0)return a[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xt,shadowCameraNear:1,shadowCameraFar:1e3};break}return a[t.id]=e,e}}}var ng=0;function sg(a,t){return(t.castShadow?2:0)-(a.castShadow?2:0)+(t.map?1:0)-(a.map?1:0)}function rg(a){let t=new eg,e=ig(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new P);let n=new P,s=new Qt,r=new Qt;function o(c){let h=0,d=0,u=0;for(let D=0;D<9;D++)i.probe[D].set(0,0,0);let f=0,g=0,y=0,p=0,m=0,x=0,v=0,b=0,_=0,A=0,T=0;c.sort(sg);for(let D=0,w=c.length;D<w;D++){let M=c[D],L=M.color,U=M.intensity,H=M.distance,Y=M.shadow&&M.shadow.map?M.shadow.map.texture:null;if(M.isAmbientLight)h+=L.r*U,d+=L.g*U,u+=L.b*U;else if(M.isLightProbe){for(let B=0;B<9;B++)i.probe[B].addScaledVector(M.sh.coefficients[B],U);T++}else if(M.isDirectionalLight){let B=t.get(M);if(B.color.copy(M.color).multiplyScalar(M.intensity),M.castShadow){let et=M.shadow,q=e.get(M);q.shadowIntensity=et.intensity,q.shadowBias=et.bias,q.shadowNormalBias=et.normalBias,q.shadowRadius=et.radius,q.shadowMapSize=et.mapSize,i.directionalShadow[f]=q,i.directionalShadowMap[f]=Y,i.directionalShadowMatrix[f]=M.shadow.matrix,x++}i.directional[f]=B,f++}else if(M.isSpotLight){let B=t.get(M);B.position.setFromMatrixPosition(M.matrixWorld),B.color.copy(L).multiplyScalar(U),B.distance=H,B.coneCos=Math.cos(M.angle),B.penumbraCos=Math.cos(M.angle*(1-M.penumbra)),B.decay=M.decay,i.spot[y]=B;let et=M.shadow;if(M.map&&(i.spotLightMap[_]=M.map,_++,et.updateMatrices(M),M.castShadow&&A++),i.spotLightMatrix[y]=et.matrix,M.castShadow){let q=e.get(M);q.shadowIntensity=et.intensity,q.shadowBias=et.bias,q.shadowNormalBias=et.normalBias,q.shadowRadius=et.radius,q.shadowMapSize=et.mapSize,i.spotShadow[y]=q,i.spotShadowMap[y]=Y,b++}y++}else if(M.isRectAreaLight){let B=t.get(M);B.color.copy(L).multiplyScalar(U),B.halfWidth.set(M.width*.5,0,0),B.halfHeight.set(0,M.height*.5,0),i.rectArea[p]=B,p++}else if(M.isPointLight){let B=t.get(M);if(B.color.copy(M.color).multiplyScalar(M.intensity),B.distance=M.distance,B.decay=M.decay,M.castShadow){let et=M.shadow,q=e.get(M);q.shadowIntensity=et.intensity,q.shadowBias=et.bias,q.shadowNormalBias=et.normalBias,q.shadowRadius=et.radius,q.shadowMapSize=et.mapSize,q.shadowCameraNear=et.camera.near,q.shadowCameraFar=et.camera.far,i.pointShadow[g]=q,i.pointShadowMap[g]=Y,i.pointShadowMatrix[g]=M.shadow.matrix,v++}i.point[g]=B,g++}else if(M.isHemisphereLight){let B=t.get(M);B.skyColor.copy(M.color).multiplyScalar(U),B.groundColor.copy(M.groundColor).multiplyScalar(U),i.hemi[m]=B,m++}}p>0&&(a.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=dt.LTC_FLOAT_1,i.rectAreaLTC2=dt.LTC_FLOAT_2):(i.rectAreaLTC1=dt.LTC_HALF_1,i.rectAreaLTC2=dt.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=u;let k=i.hash;(k.directionalLength!==f||k.pointLength!==g||k.spotLength!==y||k.rectAreaLength!==p||k.hemiLength!==m||k.numDirectionalShadows!==x||k.numPointShadows!==v||k.numSpotShadows!==b||k.numSpotMaps!==_||k.numLightProbes!==T)&&(i.directional.length=f,i.spot.length=y,i.rectArea.length=p,i.point.length=g,i.hemi.length=m,i.directionalShadow.length=x,i.directionalShadowMap.length=x,i.pointShadow.length=v,i.pointShadowMap.length=v,i.spotShadow.length=b,i.spotShadowMap.length=b,i.directionalShadowMatrix.length=x,i.pointShadowMatrix.length=v,i.spotLightMatrix.length=b+_-A,i.spotLightMap.length=_,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=T,k.directionalLength=f,k.pointLength=g,k.spotLength=y,k.rectAreaLength=p,k.hemiLength=m,k.numDirectionalShadows=x,k.numPointShadows=v,k.numSpotShadows=b,k.numSpotMaps=_,k.numLightProbes=T,i.version=ng++)}function l(c,h){let d=0,u=0,f=0,g=0,y=0,p=h.matrixWorldInverse;for(let m=0,x=c.length;m<x;m++){let v=c[m];if(v.isDirectionalLight){let b=i.directional[d];b.direction.setFromMatrixPosition(v.matrixWorld),n.setFromMatrixPosition(v.target.matrixWorld),b.direction.sub(n),b.direction.transformDirection(p),d++}else if(v.isSpotLight){let b=i.spot[f];b.position.setFromMatrixPosition(v.matrixWorld),b.position.applyMatrix4(p),b.direction.setFromMatrixPosition(v.matrixWorld),n.setFromMatrixPosition(v.target.matrixWorld),b.direction.sub(n),b.direction.transformDirection(p),f++}else if(v.isRectAreaLight){let b=i.rectArea[g];b.position.setFromMatrixPosition(v.matrixWorld),b.position.applyMatrix4(p),r.identity(),s.copy(v.matrixWorld),s.premultiply(p),r.extractRotation(s),b.halfWidth.set(v.width*.5,0,0),b.halfHeight.set(0,v.height*.5,0),b.halfWidth.applyMatrix4(r),b.halfHeight.applyMatrix4(r),g++}else if(v.isPointLight){let b=i.point[u];b.position.setFromMatrixPosition(v.matrixWorld),b.position.applyMatrix4(p),u++}else if(v.isHemisphereLight){let b=i.hemi[y];b.direction.setFromMatrixPosition(v.matrixWorld),b.direction.transformDirection(p),y++}}}return{setup:o,setupView:l,state:i}}function Ah(a){let t=new rg(a),e=[],i=[];function n(h){c.camera=h,e.length=0,i.length=0}function s(h){e.push(h)}function r(h){i.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}let c={lightsArray:e,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:n,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:r}}function ag(a){let t=new WeakMap;function e(n,s=0){let r=t.get(n),o;return r===void 0?(o=new Ah(a),t.set(n,[o])):s>=r.length?(o=new Ah(a),r.push(o)):o=r[s],o}function i(){t=new WeakMap}return{get:e,dispose:i}}var Cl=class extends gn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=du,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},kl=class extends gn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},og=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,lg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function cg(a,t,e){let i=new zs,n=new Xt,s=new Xt,r=new ve,o=new Cl({depthPacking:uu}),l=new kl,c={},h=e.maxTextureSize,d={[Ii]:Ze,[Ze]:Ii,[_e]:_e},u=new Si({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Xt},radius:{value:4}},vertexShader:og,fragmentShader:lg}),f=u.clone();f.defines.HORIZONTAL_PASS=1;let g=new ke;g.setAttribute("position",new de(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new At(g,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Oh;let m=this.type;this.render=function(A,T,k){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;let D=a.getRenderTarget(),w=a.getActiveCubeFace(),M=a.getActiveMipmapLevel(),L=a.state;L.setBlending(un),L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);let U=m!==Yi&&this.type===Yi,H=m===Yi&&this.type!==Yi;for(let Y=0,B=A.length;Y<B;Y++){let et=A[Y],q=et.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",et,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;n.copy(q.mapSize);let ht=q.getFrameExtents();if(n.multiply(ht),s.copy(q.mapSize),(n.x>h||n.y>h)&&(n.x>h&&(s.x=Math.floor(h/ht.x),n.x=s.x*ht.x,q.mapSize.x=s.x),n.y>h&&(s.y=Math.floor(h/ht.y),n.y=s.y*ht.y,q.mapSize.y=s.y)),q.map===null||U===!0||H===!0){let ct=this.type!==Yi?{minFilter:oi,magFilter:oi}:{};q.map!==null&&q.map.dispose(),q.map=new Ji(n.x,n.y,ct),q.map.texture.name=et.name+".shadowMap",q.camera.updateProjectionMatrix()}a.setRenderTarget(q.map),a.clear();let it=q.getViewportCount();for(let ct=0;ct<it;ct++){let Wt=q.getViewport(ct);r.set(s.x*Wt.x,s.y*Wt.y,s.x*Wt.z,s.y*Wt.w),L.viewport(r),q.updateMatrices(et,ct),i=q.getFrustum(),b(T,k,q.camera,et,this.type)}q.isPointLightShadow!==!0&&this.type===Yi&&x(q,k),q.needsUpdate=!1}m=this.type,p.needsUpdate=!1,a.setRenderTarget(D,w,M)};function x(A,T){let k=t.update(y);u.defines.VSM_SAMPLES!==A.blurSamples&&(u.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Ji(n.x,n.y)),u.uniforms.shadow_pass.value=A.map.texture,u.uniforms.resolution.value=A.mapSize,u.uniforms.radius.value=A.radius,a.setRenderTarget(A.mapPass),a.clear(),a.renderBufferDirect(T,null,k,u,y,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,a.setRenderTarget(A.map),a.clear(),a.renderBufferDirect(T,null,k,f,y,null)}function v(A,T,k,D){let w=null,M=k.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(M!==void 0)w=M;else if(w=k.isPointLight===!0?l:o,a.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){let L=w.uuid,U=T.uuid,H=c[L];H===void 0&&(H={},c[L]=H);let Y=H[U];Y===void 0&&(Y=w.clone(),H[U]=Y,T.addEventListener("dispose",_)),w=Y}if(w.visible=T.visible,w.wireframe=T.wireframe,D===Yi?w.side=T.shadowSide!==null?T.shadowSide:T.side:w.side=T.shadowSide!==null?T.shadowSide:d[T.side],w.alphaMap=T.alphaMap,w.alphaTest=T.alphaTest,w.map=T.map,w.clipShadows=T.clipShadows,w.clippingPlanes=T.clippingPlanes,w.clipIntersection=T.clipIntersection,w.displacementMap=T.displacementMap,w.displacementScale=T.displacementScale,w.displacementBias=T.displacementBias,w.wireframeLinewidth=T.wireframeLinewidth,w.linewidth=T.linewidth,k.isPointLight===!0&&w.isMeshDistanceMaterial===!0){let L=a.properties.get(w);L.light=k}return w}function b(A,T,k,D,w){if(A.visible===!1)return;if(A.layers.test(T.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&w===Yi)&&(!A.frustumCulled||i.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,A.matrixWorld);let U=t.update(A),H=A.material;if(Array.isArray(H)){let Y=U.groups;for(let B=0,et=Y.length;B<et;B++){let q=Y[B],ht=H[q.materialIndex];if(ht&&ht.visible){let it=v(A,ht,D,w);A.onBeforeShadow(a,A,T,k,U,it,q),a.renderBufferDirect(k,null,U,it,A,q),A.onAfterShadow(a,A,T,k,U,it,q)}}}else if(H.visible){let Y=v(A,H,D,w);A.onBeforeShadow(a,A,T,k,U,Y,null),a.renderBufferDirect(k,null,U,Y,A,null),A.onAfterShadow(a,A,T,k,U,Y,null)}}let L=A.children;for(let U=0,H=L.length;U<H;U++)b(L[U],T,k,D,w)}function _(A){A.target.removeEventListener("dispose",_);for(let k in c){let D=c[k],w=A.target.uuid;w in D&&(D[w].dispose(),delete D[w])}}}var hg={[No]:zo,[Uo]:Bo,[Oo]:Ho,[os]:Fo,[zo]:No,[Bo]:Uo,[Ho]:Oo,[Fo]:os};function dg(a){function t(){let z=!1,wt=new ve,$=null,tt=new ve(0,0,0,0);return{setMask:function(yt){$!==yt&&!z&&(a.colorMask(yt,yt,yt,yt),$=yt)},setLocked:function(yt){z=yt},setClear:function(yt,_t,le,Le,ni){ni===!0&&(yt*=Le,_t*=Le,le*=Le),wt.set(yt,_t,le,Le),tt.equals(wt)===!1&&(a.clearColor(yt,_t,le,Le),tt.copy(wt))},reset:function(){z=!1,$=null,tt.set(-1,0,0,0)}}}function e(){let z=!1,wt=!1,$=null,tt=null,yt=null;return{setReversed:function(_t){wt=_t},setTest:function(_t){_t?ut(a.DEPTH_TEST):ft(a.DEPTH_TEST)},setMask:function(_t){$!==_t&&!z&&(a.depthMask(_t),$=_t)},setFunc:function(_t){if(wt&&(_t=hg[_t]),tt!==_t){switch(_t){case No:a.depthFunc(a.NEVER);break;case zo:a.depthFunc(a.ALWAYS);break;case Uo:a.depthFunc(a.LESS);break;case os:a.depthFunc(a.LEQUAL);break;case Oo:a.depthFunc(a.EQUAL);break;case Fo:a.depthFunc(a.GEQUAL);break;case Bo:a.depthFunc(a.GREATER);break;case Ho:a.depthFunc(a.NOTEQUAL);break;default:a.depthFunc(a.LEQUAL)}tt=_t}},setLocked:function(_t){z=_t},setClear:function(_t){yt!==_t&&(a.clearDepth(_t),yt=_t)},reset:function(){z=!1,$=null,tt=null,yt=null}}}function i(){let z=!1,wt=null,$=null,tt=null,yt=null,_t=null,le=null,Le=null,ni=null;return{setTest:function(ue){z||(ue?ut(a.STENCIL_TEST):ft(a.STENCIL_TEST))},setMask:function(ue){wt!==ue&&!z&&(a.stencilMask(ue),wt=ue)},setFunc:function(ue,si,Vi){($!==ue||tt!==si||yt!==Vi)&&(a.stencilFunc(ue,si,Vi),$=ue,tt=si,yt=Vi)},setOp:function(ue,si,Vi){(_t!==ue||le!==si||Le!==Vi)&&(a.stencilOp(ue,si,Vi),_t=ue,le=si,Le=Vi)},setLocked:function(ue){z=ue},setClear:function(ue){ni!==ue&&(a.clearStencil(ue),ni=ue)},reset:function(){z=!1,wt=null,$=null,tt=null,yt=null,_t=null,le=null,Le=null,ni=null}}}let n=new t,s=new e,r=new i,o=new WeakMap,l=new WeakMap,c={},h={},d=new WeakMap,u=[],f=null,g=!1,y=null,p=null,m=null,x=null,v=null,b=null,_=null,A=new mt(0,0,0),T=0,k=!1,D=null,w=null,M=null,L=null,U=null,H=a.getParameter(a.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,B=0,et=a.getParameter(a.VERSION);et.indexOf("WebGL")!==-1?(B=parseFloat(/^WebGL (\d)/.exec(et)[1]),Y=B>=1):et.indexOf("OpenGL ES")!==-1&&(B=parseFloat(/^OpenGL ES (\d)/.exec(et)[1]),Y=B>=2);let q=null,ht={},it=a.getParameter(a.SCISSOR_BOX),ct=a.getParameter(a.VIEWPORT),Wt=new ve().fromArray(it),Jt=new ve().fromArray(ct);function j(z,wt,$,tt){let yt=new Uint8Array(4),_t=a.createTexture();a.bindTexture(z,_t),a.texParameteri(z,a.TEXTURE_MIN_FILTER,a.NEAREST),a.texParameteri(z,a.TEXTURE_MAG_FILTER,a.NEAREST);for(let le=0;le<$;le++)z===a.TEXTURE_3D||z===a.TEXTURE_2D_ARRAY?a.texImage3D(wt,0,a.RGBA,1,1,tt,0,a.RGBA,a.UNSIGNED_BYTE,yt):a.texImage2D(wt+le,0,a.RGBA,1,1,0,a.RGBA,a.UNSIGNED_BYTE,yt);return _t}let nt={};nt[a.TEXTURE_2D]=j(a.TEXTURE_2D,a.TEXTURE_2D,1),nt[a.TEXTURE_CUBE_MAP]=j(a.TEXTURE_CUBE_MAP,a.TEXTURE_CUBE_MAP_POSITIVE_X,6),nt[a.TEXTURE_2D_ARRAY]=j(a.TEXTURE_2D_ARRAY,a.TEXTURE_2D_ARRAY,1,1),nt[a.TEXTURE_3D]=j(a.TEXTURE_3D,a.TEXTURE_3D,1,1),n.setClear(0,0,0,1),s.setClear(1),r.setClear(0),ut(a.DEPTH_TEST),s.setFunc(os),ne(!1),ce(Dc),ut(a.CULL_FACE),N(un);function ut(z){c[z]!==!0&&(a.enable(z),c[z]=!0)}function ft(z){c[z]!==!1&&(a.disable(z),c[z]=!1)}function Nt(z,wt){return h[z]!==wt?(a.bindFramebuffer(z,wt),h[z]=wt,z===a.DRAW_FRAMEBUFFER&&(h[a.FRAMEBUFFER]=wt),z===a.FRAMEBUFFER&&(h[a.DRAW_FRAMEBUFFER]=wt),!0):!1}function Ut(z,wt){let $=u,tt=!1;if(z){$=d.get(wt),$===void 0&&($=[],d.set(wt,$));let yt=z.textures;if($.length!==yt.length||$[0]!==a.COLOR_ATTACHMENT0){for(let _t=0,le=yt.length;_t<le;_t++)$[_t]=a.COLOR_ATTACHMENT0+_t;$.length=yt.length,tt=!0}}else $[0]!==a.BACK&&($[0]=a.BACK,tt=!0);tt&&a.drawBuffers($)}function ae(z){return f!==z?(a.useProgram(z),f=z,!0):!1}let xe={[Rn]:a.FUNC_ADD,[Fd]:a.FUNC_SUBTRACT,[Bd]:a.FUNC_REVERSE_SUBTRACT};xe[Hd]=a.MIN,xe[Vd]=a.MAX;let oe={[Gd]:a.ZERO,[Wd]:a.ONE,[qd]:a.SRC_COLOR,[Lo]:a.SRC_ALPHA,[Kd]:a.SRC_ALPHA_SATURATE,[jd]:a.DST_COLOR,[$d]:a.DST_ALPHA,[Xd]:a.ONE_MINUS_SRC_COLOR,[Do]:a.ONE_MINUS_SRC_ALPHA,[Zd]:a.ONE_MINUS_DST_COLOR,[Yd]:a.ONE_MINUS_DST_ALPHA,[Jd]:a.CONSTANT_COLOR,[Qd]:a.ONE_MINUS_CONSTANT_COLOR,[tu]:a.CONSTANT_ALPHA,[eu]:a.ONE_MINUS_CONSTANT_ALPHA};function N(z,wt,$,tt,yt,_t,le,Le,ni,ue){if(z===un){g===!0&&(ft(a.BLEND),g=!1);return}if(g===!1&&(ut(a.BLEND),g=!0),z!==Od){if(z!==y||ue!==k){if((p!==Rn||v!==Rn)&&(a.blendEquation(a.FUNC_ADD),p=Rn,v=Rn),ue)switch(z){case ns:a.blendFuncSeparate(a.ONE,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);break;case Oi:a.blendFunc(a.ONE,a.ONE);break;case Nc:a.blendFuncSeparate(a.ZERO,a.ONE_MINUS_SRC_COLOR,a.ZERO,a.ONE);break;case zc:a.blendFuncSeparate(a.ZERO,a.SRC_COLOR,a.ZERO,a.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}else switch(z){case ns:a.blendFuncSeparate(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);break;case Oi:a.blendFunc(a.SRC_ALPHA,a.ONE);break;case Nc:a.blendFuncSeparate(a.ZERO,a.ONE_MINUS_SRC_COLOR,a.ZERO,a.ONE);break;case zc:a.blendFunc(a.ZERO,a.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}m=null,x=null,b=null,_=null,A.set(0,0,0),T=0,y=z,k=ue}return}yt=yt||wt,_t=_t||$,le=le||tt,(wt!==p||yt!==v)&&(a.blendEquationSeparate(xe[wt],xe[yt]),p=wt,v=yt),($!==m||tt!==x||_t!==b||le!==_)&&(a.blendFuncSeparate(oe[$],oe[tt],oe[_t],oe[le]),m=$,x=tt,b=_t,_=le),(Le.equals(A)===!1||ni!==T)&&(a.blendColor(Le.r,Le.g,Le.b,ni),A.copy(Le),T=ni),y=z,k=!1}function di(z,wt){z.side===_e?ft(a.CULL_FACE):ut(a.CULL_FACE);let $=z.side===Ze;wt&&($=!$),ne($),z.blending===ns&&z.transparent===!1?N(un):N(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),s.setFunc(z.depthFunc),s.setTest(z.depthTest),s.setMask(z.depthWrite),n.setMask(z.colorWrite);let tt=z.stencilWrite;r.setTest(tt),tt&&(r.setMask(z.stencilWriteMask),r.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),r.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),Se(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?ut(a.SAMPLE_ALPHA_TO_COVERAGE):ft(a.SAMPLE_ALPHA_TO_COVERAGE)}function ne(z){D!==z&&(z?a.frontFace(a.CW):a.frontFace(a.CCW),D=z)}function ce(z){z!==zd?(ut(a.CULL_FACE),z!==w&&(z===Dc?a.cullFace(a.BACK):z===Ud?a.cullFace(a.FRONT):a.cullFace(a.FRONT_AND_BACK))):ft(a.CULL_FACE),w=z}function Ht(z){z!==M&&(Y&&a.lineWidth(z),M=z)}function Se(z,wt,$){z?(ut(a.POLYGON_OFFSET_FILL),(L!==wt||U!==$)&&(a.polygonOffset(wt,$),L=wt,U=$)):ft(a.POLYGON_OFFSET_FILL)}function qt(z){z?ut(a.SCISSOR_TEST):ft(a.SCISSOR_TEST)}function I(z){z===void 0&&(z=a.TEXTURE0+H-1),q!==z&&(a.activeTexture(z),q=z)}function S(z,wt,$){$===void 0&&(q===null?$=a.TEXTURE0+H-1:$=q);let tt=ht[$];tt===void 0&&(tt={type:void 0,texture:void 0},ht[$]=tt),(tt.type!==z||tt.texture!==wt)&&(q!==$&&(a.activeTexture($),q=$),a.bindTexture(z,wt||nt[z]),tt.type=z,tt.texture=wt)}function V(){let z=ht[q];z!==void 0&&z.type!==void 0&&(a.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function Q(){try{a.compressedTexImage2D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function st(){try{a.compressedTexImage3D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function K(){try{a.texSubImage2D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function It(){try{a.texSubImage3D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function pt(){try{a.compressedTexSubImage2D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function St(){try{a.compressedTexSubImage3D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function he(){try{a.texStorage2D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function at(){try{a.texStorage3D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Et(){try{a.texImage2D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Vt(){try{a.texImage3D.apply(a,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Gt(z){Wt.equals(z)===!1&&(a.scissor(z.x,z.y,z.z,z.w),Wt.copy(z))}function Tt(z){Jt.equals(z)===!1&&(a.viewport(z.x,z.y,z.z,z.w),Jt.copy(z))}function se(z,wt){let $=l.get(wt);$===void 0&&($=new WeakMap,l.set(wt,$));let tt=$.get(z);tt===void 0&&(tt=a.getUniformBlockIndex(wt,z.name),$.set(z,tt))}function Yt(z,wt){let tt=l.get(wt).get(z);o.get(wt)!==tt&&(a.uniformBlockBinding(wt,tt,z.__bindingPointIndex),o.set(wt,tt))}function we(){a.disable(a.BLEND),a.disable(a.CULL_FACE),a.disable(a.DEPTH_TEST),a.disable(a.POLYGON_OFFSET_FILL),a.disable(a.SCISSOR_TEST),a.disable(a.STENCIL_TEST),a.disable(a.SAMPLE_ALPHA_TO_COVERAGE),a.blendEquation(a.FUNC_ADD),a.blendFunc(a.ONE,a.ZERO),a.blendFuncSeparate(a.ONE,a.ZERO,a.ONE,a.ZERO),a.blendColor(0,0,0,0),a.colorMask(!0,!0,!0,!0),a.clearColor(0,0,0,0),a.depthMask(!0),a.depthFunc(a.LESS),a.clearDepth(1),a.stencilMask(4294967295),a.stencilFunc(a.ALWAYS,0,4294967295),a.stencilOp(a.KEEP,a.KEEP,a.KEEP),a.clearStencil(0),a.cullFace(a.BACK),a.frontFace(a.CCW),a.polygonOffset(0,0),a.activeTexture(a.TEXTURE0),a.bindFramebuffer(a.FRAMEBUFFER,null),a.bindFramebuffer(a.DRAW_FRAMEBUFFER,null),a.bindFramebuffer(a.READ_FRAMEBUFFER,null),a.useProgram(null),a.lineWidth(1),a.scissor(0,0,a.canvas.width,a.canvas.height),a.viewport(0,0,a.canvas.width,a.canvas.height),c={},q=null,ht={},h={},d=new WeakMap,u=[],f=null,g=!1,y=null,p=null,m=null,x=null,v=null,b=null,_=null,A=new mt(0,0,0),T=0,k=!1,D=null,w=null,M=null,L=null,U=null,Wt.set(0,0,a.canvas.width,a.canvas.height),Jt.set(0,0,a.canvas.width,a.canvas.height),n.reset(),s.reset(),r.reset()}return{buffers:{color:n,depth:s,stencil:r},enable:ut,disable:ft,bindFramebuffer:Nt,drawBuffers:Ut,useProgram:ae,setBlending:N,setMaterial:di,setFlipSided:ne,setCullFace:ce,setLineWidth:Ht,setPolygonOffset:Se,setScissorTest:qt,activeTexture:I,bindTexture:S,unbindTexture:V,compressedTexImage2D:Q,compressedTexImage3D:st,texImage2D:Et,texImage3D:Vt,updateUBOMapping:se,uniformBlockBinding:Yt,texStorage2D:he,texStorage3D:at,texSubImage2D:K,texSubImage3D:It,compressedTexSubImage2D:pt,compressedTexSubImage3D:St,scissor:Gt,viewport:Tt,reset:we}}function Rh(a,t,e,i){let n=ug(i);switch(e){case Wh:return a*t;case Xh:return a*t;case $h:return a*t*2;case ic:return a*t/n.components*n.byteLength;case nc:return a*t/n.components*n.byteLength;case Yh:return a*t*2/n.components*n.byteLength;case sc:return a*t*2/n.components*n.byteLength;case qh:return a*t*3/n.components*n.byteLength;case je:return a*t*4/n.components*n.byteLength;case rc:return a*t*4/n.components*n.byteLength;case Nr:case zr:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*8;case Ur:case Or:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case Xo:case Yo:return Math.max(a,16)*Math.max(t,8)/4;case qo:case $o:return Math.max(a,8)*Math.max(t,8)/2;case jo:case Zo:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*8;case Ko:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case Jo:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case Qo:return Math.floor((a+4)/5)*Math.floor((t+3)/4)*16;case tl:return Math.floor((a+4)/5)*Math.floor((t+4)/5)*16;case el:return Math.floor((a+5)/6)*Math.floor((t+4)/5)*16;case il:return Math.floor((a+5)/6)*Math.floor((t+5)/6)*16;case nl:return Math.floor((a+7)/8)*Math.floor((t+4)/5)*16;case sl:return Math.floor((a+7)/8)*Math.floor((t+5)/6)*16;case rl:return Math.floor((a+7)/8)*Math.floor((t+7)/8)*16;case al:return Math.floor((a+9)/10)*Math.floor((t+4)/5)*16;case ol:return Math.floor((a+9)/10)*Math.floor((t+5)/6)*16;case ll:return Math.floor((a+9)/10)*Math.floor((t+7)/8)*16;case cl:return Math.floor((a+9)/10)*Math.floor((t+9)/10)*16;case hl:return Math.floor((a+11)/12)*Math.floor((t+9)/10)*16;case dl:return Math.floor((a+11)/12)*Math.floor((t+11)/12)*16;case Fr:case ul:case fl:return Math.ceil(a/4)*Math.ceil(t/4)*16;case jh:case pl:return Math.ceil(a/4)*Math.ceil(t/4)*8;case ml:case gl:return Math.ceil(a/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function ug(a){switch(a){case li:case Hh:return{byteLength:1,components:1};case Ls:case Vh:case Bs:return{byteLength:2,components:1};case tc:case ec:return{byteLength:2,components:4};case In:case Ql:case Ui:return{byteLength:4,components:1};case Gh:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${a}.`)}function fg(a,t,e,i,n,s,r){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Xt,h=new WeakMap,d,u=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(I,S){return f?new OffscreenCanvas(I,S):$r("canvas")}function y(I,S,V){let Q=1,st=qt(I);if((st.width>V||st.height>V)&&(Q=V/Math.max(st.width,st.height)),Q<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let K=Math.floor(Q*st.width),It=Math.floor(Q*st.height);d===void 0&&(d=g(K,It));let pt=S?g(K,It):d;return pt.width=K,pt.height=It,pt.getContext("2d").drawImage(I,0,0,K,It),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+st.width+"x"+st.height+") to ("+K+"x"+It+")."),pt}else return"data"in I&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+st.width+"x"+st.height+")."),I;return I}function p(I){return I.generateMipmaps&&I.minFilter!==oi&&I.minFilter!==We}function m(I){a.generateMipmap(I)}function x(I,S,V,Q,st=!1){if(I!==null){if(a[I]!==void 0)return a[I];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let K=S;if(S===a.RED&&(V===a.FLOAT&&(K=a.R32F),V===a.HALF_FLOAT&&(K=a.R16F),V===a.UNSIGNED_BYTE&&(K=a.R8)),S===a.RED_INTEGER&&(V===a.UNSIGNED_BYTE&&(K=a.R8UI),V===a.UNSIGNED_SHORT&&(K=a.R16UI),V===a.UNSIGNED_INT&&(K=a.R32UI),V===a.BYTE&&(K=a.R8I),V===a.SHORT&&(K=a.R16I),V===a.INT&&(K=a.R32I)),S===a.RG&&(V===a.FLOAT&&(K=a.RG32F),V===a.HALF_FLOAT&&(K=a.RG16F),V===a.UNSIGNED_BYTE&&(K=a.RG8)),S===a.RG_INTEGER&&(V===a.UNSIGNED_BYTE&&(K=a.RG8UI),V===a.UNSIGNED_SHORT&&(K=a.RG16UI),V===a.UNSIGNED_INT&&(K=a.RG32UI),V===a.BYTE&&(K=a.RG8I),V===a.SHORT&&(K=a.RG16I),V===a.INT&&(K=a.RG32I)),S===a.RGB_INTEGER&&(V===a.UNSIGNED_BYTE&&(K=a.RGB8UI),V===a.UNSIGNED_SHORT&&(K=a.RGB16UI),V===a.UNSIGNED_INT&&(K=a.RGB32UI),V===a.BYTE&&(K=a.RGB8I),V===a.SHORT&&(K=a.RGB16I),V===a.INT&&(K=a.RGB32I)),S===a.RGBA_INTEGER&&(V===a.UNSIGNED_BYTE&&(K=a.RGBA8UI),V===a.UNSIGNED_SHORT&&(K=a.RGBA16UI),V===a.UNSIGNED_INT&&(K=a.RGBA32UI),V===a.BYTE&&(K=a.RGBA8I),V===a.SHORT&&(K=a.RGBA16I),V===a.INT&&(K=a.RGBA32I)),S===a.RGB&&V===a.UNSIGNED_INT_5_9_9_9_REV&&(K=a.RGB9_E5),S===a.RGBA){let It=st?Vr:me.getTransfer(Q);V===a.FLOAT&&(K=a.RGBA32F),V===a.HALF_FLOAT&&(K=a.RGBA16F),V===a.UNSIGNED_BYTE&&(K=It===Te?a.SRGB8_ALPHA8:a.RGBA8),V===a.UNSIGNED_SHORT_4_4_4_4&&(K=a.RGBA4),V===a.UNSIGNED_SHORT_5_5_5_1&&(K=a.RGB5_A1)}return(K===a.R16F||K===a.R32F||K===a.RG16F||K===a.RG32F||K===a.RGBA16F||K===a.RGBA32F)&&t.get("EXT_color_buffer_float"),K}function v(I,S){let V;return I?S===null||S===In||S===hs?V=a.DEPTH24_STENCIL8:S===Ui?V=a.DEPTH32F_STENCIL8:S===Ls&&(V=a.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===In||S===hs?V=a.DEPTH_COMPONENT24:S===Ui?V=a.DEPTH_COMPONENT32F:S===Ls&&(V=a.DEPTH_COMPONENT16),V}function b(I,S){return p(I)===!0||I.isFramebufferTexture&&I.minFilter!==oi&&I.minFilter!==We?Math.log2(Math.max(S.width,S.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?S.mipmaps.length:1}function _(I){let S=I.target;S.removeEventListener("dispose",_),T(S),S.isVideoTexture&&h.delete(S)}function A(I){let S=I.target;S.removeEventListener("dispose",A),D(S)}function T(I){let S=i.get(I);if(S.__webglInit===void 0)return;let V=I.source,Q=u.get(V);if(Q){let st=Q[S.__cacheKey];st.usedTimes--,st.usedTimes===0&&k(I),Object.keys(Q).length===0&&u.delete(V)}i.remove(I)}function k(I){let S=i.get(I);a.deleteTexture(S.__webglTexture);let V=I.source,Q=u.get(V);delete Q[S.__cacheKey],r.memory.textures--}function D(I){let S=i.get(I);if(I.depthTexture&&I.depthTexture.dispose(),I.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(S.__webglFramebuffer[Q]))for(let st=0;st<S.__webglFramebuffer[Q].length;st++)a.deleteFramebuffer(S.__webglFramebuffer[Q][st]);else a.deleteFramebuffer(S.__webglFramebuffer[Q]);S.__webglDepthbuffer&&a.deleteRenderbuffer(S.__webglDepthbuffer[Q])}else{if(Array.isArray(S.__webglFramebuffer))for(let Q=0;Q<S.__webglFramebuffer.length;Q++)a.deleteFramebuffer(S.__webglFramebuffer[Q]);else a.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&a.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&a.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let Q=0;Q<S.__webglColorRenderbuffer.length;Q++)S.__webglColorRenderbuffer[Q]&&a.deleteRenderbuffer(S.__webglColorRenderbuffer[Q]);S.__webglDepthRenderbuffer&&a.deleteRenderbuffer(S.__webglDepthRenderbuffer)}let V=I.textures;for(let Q=0,st=V.length;Q<st;Q++){let K=i.get(V[Q]);K.__webglTexture&&(a.deleteTexture(K.__webglTexture),r.memory.textures--),i.remove(V[Q])}i.remove(I)}let w=0;function M(){w=0}function L(){let I=w;return I>=n.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+I+" texture units while this GPU supports only "+n.maxTextures),w+=1,I}function U(I){let S=[];return S.push(I.wrapS),S.push(I.wrapT),S.push(I.wrapR||0),S.push(I.magFilter),S.push(I.minFilter),S.push(I.anisotropy),S.push(I.internalFormat),S.push(I.format),S.push(I.type),S.push(I.generateMipmaps),S.push(I.premultiplyAlpha),S.push(I.flipY),S.push(I.unpackAlignment),S.push(I.colorSpace),S.join()}function H(I,S){let V=i.get(I);if(I.isVideoTexture&&Ht(I),I.isRenderTargetTexture===!1&&I.version>0&&V.__version!==I.version){let Q=I.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Jt(V,I,S);return}}e.bindTexture(a.TEXTURE_2D,V.__webglTexture,a.TEXTURE0+S)}function Y(I,S){let V=i.get(I);if(I.version>0&&V.__version!==I.version){Jt(V,I,S);return}e.bindTexture(a.TEXTURE_2D_ARRAY,V.__webglTexture,a.TEXTURE0+S)}function B(I,S){let V=i.get(I);if(I.version>0&&V.__version!==I.version){Jt(V,I,S);return}e.bindTexture(a.TEXTURE_3D,V.__webglTexture,a.TEXTURE0+S)}function et(I,S){let V=i.get(I);if(I.version>0&&V.__version!==I.version){j(V,I,S);return}e.bindTexture(a.TEXTURE_CUBE_MAP,V.__webglTexture,a.TEXTURE0+S)}let q={[Pn]:a.REPEAT,[Zi]:a.CLAMP_TO_EDGE,[Wo]:a.MIRRORED_REPEAT},ht={[oi]:a.NEAREST,[hu]:a.NEAREST_MIPMAP_NEAREST,[hr]:a.NEAREST_MIPMAP_LINEAR,[We]:a.LINEAR,[Qa]:a.LINEAR_MIPMAP_NEAREST,[Pi]:a.LINEAR_MIPMAP_LINEAR},it={[pu]:a.NEVER,[bu]:a.ALWAYS,[mu]:a.LESS,[Kh]:a.LEQUAL,[gu]:a.EQUAL,[vu]:a.GEQUAL,[yu]:a.GREATER,[xu]:a.NOTEQUAL};function ct(I,S){if(S.type===Ui&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===We||S.magFilter===Qa||S.magFilter===hr||S.magFilter===Pi||S.minFilter===We||S.minFilter===Qa||S.minFilter===hr||S.minFilter===Pi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),a.texParameteri(I,a.TEXTURE_WRAP_S,q[S.wrapS]),a.texParameteri(I,a.TEXTURE_WRAP_T,q[S.wrapT]),(I===a.TEXTURE_3D||I===a.TEXTURE_2D_ARRAY)&&a.texParameteri(I,a.TEXTURE_WRAP_R,q[S.wrapR]),a.texParameteri(I,a.TEXTURE_MAG_FILTER,ht[S.magFilter]),a.texParameteri(I,a.TEXTURE_MIN_FILTER,ht[S.minFilter]),S.compareFunction&&(a.texParameteri(I,a.TEXTURE_COMPARE_MODE,a.COMPARE_REF_TO_TEXTURE),a.texParameteri(I,a.TEXTURE_COMPARE_FUNC,it[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===oi||S.minFilter!==hr&&S.minFilter!==Pi||S.type===Ui&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||i.get(S).__currentAnisotropy){let V=t.get("EXT_texture_filter_anisotropic");a.texParameterf(I,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,n.getMaxAnisotropy())),i.get(S).__currentAnisotropy=S.anisotropy}}}function Wt(I,S){let V=!1;I.__webglInit===void 0&&(I.__webglInit=!0,S.addEventListener("dispose",_));let Q=S.source,st=u.get(Q);st===void 0&&(st={},u.set(Q,st));let K=U(S);if(K!==I.__cacheKey){st[K]===void 0&&(st[K]={texture:a.createTexture(),usedTimes:0},r.memory.textures++,V=!0),st[K].usedTimes++;let It=st[I.__cacheKey];It!==void 0&&(st[I.__cacheKey].usedTimes--,It.usedTimes===0&&k(S)),I.__cacheKey=K,I.__webglTexture=st[K].texture}return V}function Jt(I,S,V){let Q=a.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(Q=a.TEXTURE_2D_ARRAY),S.isData3DTexture&&(Q=a.TEXTURE_3D);let st=Wt(I,S),K=S.source;e.bindTexture(Q,I.__webglTexture,a.TEXTURE0+V);let It=i.get(K);if(K.version!==It.__version||st===!0){e.activeTexture(a.TEXTURE0+V);let pt=me.getPrimaries(me.workingColorSpace),St=S.colorSpace===gi?null:me.getPrimaries(S.colorSpace),he=S.colorSpace===gi||pt===St?a.NONE:a.BROWSER_DEFAULT_WEBGL;a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,S.flipY),a.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),a.pixelStorei(a.UNPACK_ALIGNMENT,S.unpackAlignment),a.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,he);let at=y(S.image,!1,n.maxTextureSize);at=Se(S,at);let Et=s.convert(S.format,S.colorSpace),Vt=s.convert(S.type),Gt=x(S.internalFormat,Et,Vt,S.colorSpace,S.isVideoTexture);ct(Q,S);let Tt,se=S.mipmaps,Yt=S.isVideoTexture!==!0,we=It.__version===void 0||st===!0,z=K.dataReady,wt=b(S,at);if(S.isDepthTexture)Gt=v(S.format===ds,S.type),we&&(Yt?e.texStorage2D(a.TEXTURE_2D,1,Gt,at.width,at.height):e.texImage2D(a.TEXTURE_2D,0,Gt,at.width,at.height,0,Et,Vt,null));else if(S.isDataTexture)if(se.length>0){Yt&&we&&e.texStorage2D(a.TEXTURE_2D,wt,Gt,se[0].width,se[0].height);for(let $=0,tt=se.length;$<tt;$++)Tt=se[$],Yt?z&&e.texSubImage2D(a.TEXTURE_2D,$,0,0,Tt.width,Tt.height,Et,Vt,Tt.data):e.texImage2D(a.TEXTURE_2D,$,Gt,Tt.width,Tt.height,0,Et,Vt,Tt.data);S.generateMipmaps=!1}else Yt?(we&&e.texStorage2D(a.TEXTURE_2D,wt,Gt,at.width,at.height),z&&e.texSubImage2D(a.TEXTURE_2D,0,0,0,at.width,at.height,Et,Vt,at.data)):e.texImage2D(a.TEXTURE_2D,0,Gt,at.width,at.height,0,Et,Vt,at.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){Yt&&we&&e.texStorage3D(a.TEXTURE_2D_ARRAY,wt,Gt,se[0].width,se[0].height,at.depth);for(let $=0,tt=se.length;$<tt;$++)if(Tt=se[$],S.format!==je)if(Et!==null)if(Yt){if(z)if(S.layerUpdates.size>0){let yt=Rh(Tt.width,Tt.height,S.format,S.type);for(let _t of S.layerUpdates){let le=Tt.data.subarray(_t*yt/Tt.data.BYTES_PER_ELEMENT,(_t+1)*yt/Tt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(a.TEXTURE_2D_ARRAY,$,0,0,_t,Tt.width,Tt.height,1,Et,le,0,0)}S.clearLayerUpdates()}else e.compressedTexSubImage3D(a.TEXTURE_2D_ARRAY,$,0,0,0,Tt.width,Tt.height,at.depth,Et,Tt.data,0,0)}else e.compressedTexImage3D(a.TEXTURE_2D_ARRAY,$,Gt,Tt.width,Tt.height,at.depth,0,Tt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Yt?z&&e.texSubImage3D(a.TEXTURE_2D_ARRAY,$,0,0,0,Tt.width,Tt.height,at.depth,Et,Vt,Tt.data):e.texImage3D(a.TEXTURE_2D_ARRAY,$,Gt,Tt.width,Tt.height,at.depth,0,Et,Vt,Tt.data)}else{Yt&&we&&e.texStorage2D(a.TEXTURE_2D,wt,Gt,se[0].width,se[0].height);for(let $=0,tt=se.length;$<tt;$++)Tt=se[$],S.format!==je?Et!==null?Yt?z&&e.compressedTexSubImage2D(a.TEXTURE_2D,$,0,0,Tt.width,Tt.height,Et,Tt.data):e.compressedTexImage2D(a.TEXTURE_2D,$,Gt,Tt.width,Tt.height,0,Tt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Yt?z&&e.texSubImage2D(a.TEXTURE_2D,$,0,0,Tt.width,Tt.height,Et,Vt,Tt.data):e.texImage2D(a.TEXTURE_2D,$,Gt,Tt.width,Tt.height,0,Et,Vt,Tt.data)}else if(S.isDataArrayTexture)if(Yt){if(we&&e.texStorage3D(a.TEXTURE_2D_ARRAY,wt,Gt,at.width,at.height,at.depth),z)if(S.layerUpdates.size>0){let $=Rh(at.width,at.height,S.format,S.type);for(let tt of S.layerUpdates){let yt=at.data.subarray(tt*$/at.data.BYTES_PER_ELEMENT,(tt+1)*$/at.data.BYTES_PER_ELEMENT);e.texSubImage3D(a.TEXTURE_2D_ARRAY,0,0,0,tt,at.width,at.height,1,Et,Vt,yt)}S.clearLayerUpdates()}else e.texSubImage3D(a.TEXTURE_2D_ARRAY,0,0,0,0,at.width,at.height,at.depth,Et,Vt,at.data)}else e.texImage3D(a.TEXTURE_2D_ARRAY,0,Gt,at.width,at.height,at.depth,0,Et,Vt,at.data);else if(S.isData3DTexture)Yt?(we&&e.texStorage3D(a.TEXTURE_3D,wt,Gt,at.width,at.height,at.depth),z&&e.texSubImage3D(a.TEXTURE_3D,0,0,0,0,at.width,at.height,at.depth,Et,Vt,at.data)):e.texImage3D(a.TEXTURE_3D,0,Gt,at.width,at.height,at.depth,0,Et,Vt,at.data);else if(S.isFramebufferTexture){if(we)if(Yt)e.texStorage2D(a.TEXTURE_2D,wt,Gt,at.width,at.height);else{let $=at.width,tt=at.height;for(let yt=0;yt<wt;yt++)e.texImage2D(a.TEXTURE_2D,yt,Gt,$,tt,0,Et,Vt,null),$>>=1,tt>>=1}}else if(se.length>0){if(Yt&&we){let $=qt(se[0]);e.texStorage2D(a.TEXTURE_2D,wt,Gt,$.width,$.height)}for(let $=0,tt=se.length;$<tt;$++)Tt=se[$],Yt?z&&e.texSubImage2D(a.TEXTURE_2D,$,0,0,Et,Vt,Tt):e.texImage2D(a.TEXTURE_2D,$,Gt,Et,Vt,Tt);S.generateMipmaps=!1}else if(Yt){if(we){let $=qt(at);e.texStorage2D(a.TEXTURE_2D,wt,Gt,$.width,$.height)}z&&e.texSubImage2D(a.TEXTURE_2D,0,0,0,Et,Vt,at)}else e.texImage2D(a.TEXTURE_2D,0,Gt,Et,Vt,at);p(S)&&m(Q),It.__version=K.version,S.onUpdate&&S.onUpdate(S)}I.__version=S.version}function j(I,S,V){if(S.image.length!==6)return;let Q=Wt(I,S),st=S.source;e.bindTexture(a.TEXTURE_CUBE_MAP,I.__webglTexture,a.TEXTURE0+V);let K=i.get(st);if(st.version!==K.__version||Q===!0){e.activeTexture(a.TEXTURE0+V);let It=me.getPrimaries(me.workingColorSpace),pt=S.colorSpace===gi?null:me.getPrimaries(S.colorSpace),St=S.colorSpace===gi||It===pt?a.NONE:a.BROWSER_DEFAULT_WEBGL;a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,S.flipY),a.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),a.pixelStorei(a.UNPACK_ALIGNMENT,S.unpackAlignment),a.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,St);let he=S.isCompressedTexture||S.image[0].isCompressedTexture,at=S.image[0]&&S.image[0].isDataTexture,Et=[];for(let tt=0;tt<6;tt++)!he&&!at?Et[tt]=y(S.image[tt],!0,n.maxCubemapSize):Et[tt]=at?S.image[tt].image:S.image[tt],Et[tt]=Se(S,Et[tt]);let Vt=Et[0],Gt=s.convert(S.format,S.colorSpace),Tt=s.convert(S.type),se=x(S.internalFormat,Gt,Tt,S.colorSpace),Yt=S.isVideoTexture!==!0,we=K.__version===void 0||Q===!0,z=st.dataReady,wt=b(S,Vt);ct(a.TEXTURE_CUBE_MAP,S);let $;if(he){Yt&&we&&e.texStorage2D(a.TEXTURE_CUBE_MAP,wt,se,Vt.width,Vt.height);for(let tt=0;tt<6;tt++){$=Et[tt].mipmaps;for(let yt=0;yt<$.length;yt++){let _t=$[yt];S.format!==je?Gt!==null?Yt?z&&e.compressedTexSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,yt,0,0,_t.width,_t.height,Gt,_t.data):e.compressedTexImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,yt,se,_t.width,_t.height,0,_t.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Yt?z&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,yt,0,0,_t.width,_t.height,Gt,Tt,_t.data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,yt,se,_t.width,_t.height,0,Gt,Tt,_t.data)}}}else{if($=S.mipmaps,Yt&&we){$.length>0&&wt++;let tt=qt(Et[0]);e.texStorage2D(a.TEXTURE_CUBE_MAP,wt,se,tt.width,tt.height)}for(let tt=0;tt<6;tt++)if(at){Yt?z&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,Et[tt].width,Et[tt].height,Gt,Tt,Et[tt].data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,se,Et[tt].width,Et[tt].height,0,Gt,Tt,Et[tt].data);for(let yt=0;yt<$.length;yt++){let le=$[yt].image[tt].image;Yt?z&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,yt+1,0,0,le.width,le.height,Gt,Tt,le.data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,yt+1,se,le.width,le.height,0,Gt,Tt,le.data)}}else{Yt?z&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,Gt,Tt,Et[tt]):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,se,Gt,Tt,Et[tt]);for(let yt=0;yt<$.length;yt++){let _t=$[yt];Yt?z&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,yt+1,0,0,Gt,Tt,_t.image[tt]):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+tt,yt+1,se,Gt,Tt,_t.image[tt])}}}p(S)&&m(a.TEXTURE_CUBE_MAP),K.__version=st.version,S.onUpdate&&S.onUpdate(S)}I.__version=S.version}function nt(I,S,V,Q,st,K){let It=s.convert(V.format,V.colorSpace),pt=s.convert(V.type),St=x(V.internalFormat,It,pt,V.colorSpace);if(!i.get(S).__hasExternalTextures){let at=Math.max(1,S.width>>K),Et=Math.max(1,S.height>>K);st===a.TEXTURE_3D||st===a.TEXTURE_2D_ARRAY?e.texImage3D(st,K,St,at,Et,S.depth,0,It,pt,null):e.texImage2D(st,K,St,at,Et,0,It,pt,null)}e.bindFramebuffer(a.FRAMEBUFFER,I),ce(S)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,Q,st,i.get(V).__webglTexture,0,ne(S)):(st===a.TEXTURE_2D||st>=a.TEXTURE_CUBE_MAP_POSITIVE_X&&st<=a.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&a.framebufferTexture2D(a.FRAMEBUFFER,Q,st,i.get(V).__webglTexture,K),e.bindFramebuffer(a.FRAMEBUFFER,null)}function ut(I,S,V){if(a.bindRenderbuffer(a.RENDERBUFFER,I),S.depthBuffer){let Q=S.depthTexture,st=Q&&Q.isDepthTexture?Q.type:null,K=v(S.stencilBuffer,st),It=S.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,pt=ne(S);ce(S)?o.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,pt,K,S.width,S.height):V?a.renderbufferStorageMultisample(a.RENDERBUFFER,pt,K,S.width,S.height):a.renderbufferStorage(a.RENDERBUFFER,K,S.width,S.height),a.framebufferRenderbuffer(a.FRAMEBUFFER,It,a.RENDERBUFFER,I)}else{let Q=S.textures;for(let st=0;st<Q.length;st++){let K=Q[st],It=s.convert(K.format,K.colorSpace),pt=s.convert(K.type),St=x(K.internalFormat,It,pt,K.colorSpace),he=ne(S);V&&ce(S)===!1?a.renderbufferStorageMultisample(a.RENDERBUFFER,he,St,S.width,S.height):ce(S)?o.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,he,St,S.width,S.height):a.renderbufferStorage(a.RENDERBUFFER,St,S.width,S.height)}}a.bindRenderbuffer(a.RENDERBUFFER,null)}function ft(I,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(a.FRAMEBUFFER,I),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(S.depthTexture).__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),H(S.depthTexture,0);let Q=i.get(S.depthTexture).__webglTexture,st=ne(S);if(S.depthTexture.format===ss)ce(S)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.TEXTURE_2D,Q,0,st):a.framebufferTexture2D(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.TEXTURE_2D,Q,0);else if(S.depthTexture.format===ds)ce(S)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,a.DEPTH_STENCIL_ATTACHMENT,a.TEXTURE_2D,Q,0,st):a.framebufferTexture2D(a.FRAMEBUFFER,a.DEPTH_STENCIL_ATTACHMENT,a.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Nt(I){let S=i.get(I),V=I.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==I.depthTexture){let Q=I.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),Q){let st=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,Q.removeEventListener("dispose",st)};Q.addEventListener("dispose",st),S.__depthDisposeCallback=st}S.__boundDepthTexture=Q}if(I.depthTexture&&!S.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");ft(S.__webglFramebuffer,I)}else if(V){S.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)if(e.bindFramebuffer(a.FRAMEBUFFER,S.__webglFramebuffer[Q]),S.__webglDepthbuffer[Q]===void 0)S.__webglDepthbuffer[Q]=a.createRenderbuffer(),ut(S.__webglDepthbuffer[Q],I,!1);else{let st=I.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,K=S.__webglDepthbuffer[Q];a.bindRenderbuffer(a.RENDERBUFFER,K),a.framebufferRenderbuffer(a.FRAMEBUFFER,st,a.RENDERBUFFER,K)}}else if(e.bindFramebuffer(a.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=a.createRenderbuffer(),ut(S.__webglDepthbuffer,I,!1);else{let Q=I.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,st=S.__webglDepthbuffer;a.bindRenderbuffer(a.RENDERBUFFER,st),a.framebufferRenderbuffer(a.FRAMEBUFFER,Q,a.RENDERBUFFER,st)}e.bindFramebuffer(a.FRAMEBUFFER,null)}function Ut(I,S,V){let Q=i.get(I);S!==void 0&&nt(Q.__webglFramebuffer,I,I.texture,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,0),V!==void 0&&Nt(I)}function ae(I){let S=I.texture,V=i.get(I),Q=i.get(S);I.addEventListener("dispose",A);let st=I.textures,K=I.isWebGLCubeRenderTarget===!0,It=st.length>1;if(It||(Q.__webglTexture===void 0&&(Q.__webglTexture=a.createTexture()),Q.__version=S.version,r.memory.textures++),K){V.__webglFramebuffer=[];for(let pt=0;pt<6;pt++)if(S.mipmaps&&S.mipmaps.length>0){V.__webglFramebuffer[pt]=[];for(let St=0;St<S.mipmaps.length;St++)V.__webglFramebuffer[pt][St]=a.createFramebuffer()}else V.__webglFramebuffer[pt]=a.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){V.__webglFramebuffer=[];for(let pt=0;pt<S.mipmaps.length;pt++)V.__webglFramebuffer[pt]=a.createFramebuffer()}else V.__webglFramebuffer=a.createFramebuffer();if(It)for(let pt=0,St=st.length;pt<St;pt++){let he=i.get(st[pt]);he.__webglTexture===void 0&&(he.__webglTexture=a.createTexture(),r.memory.textures++)}if(I.samples>0&&ce(I)===!1){V.__webglMultisampledFramebuffer=a.createFramebuffer(),V.__webglColorRenderbuffer=[],e.bindFramebuffer(a.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let pt=0;pt<st.length;pt++){let St=st[pt];V.__webglColorRenderbuffer[pt]=a.createRenderbuffer(),a.bindRenderbuffer(a.RENDERBUFFER,V.__webglColorRenderbuffer[pt]);let he=s.convert(St.format,St.colorSpace),at=s.convert(St.type),Et=x(St.internalFormat,he,at,St.colorSpace,I.isXRRenderTarget===!0),Vt=ne(I);a.renderbufferStorageMultisample(a.RENDERBUFFER,Vt,Et,I.width,I.height),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+pt,a.RENDERBUFFER,V.__webglColorRenderbuffer[pt])}a.bindRenderbuffer(a.RENDERBUFFER,null),I.depthBuffer&&(V.__webglDepthRenderbuffer=a.createRenderbuffer(),ut(V.__webglDepthRenderbuffer,I,!0)),e.bindFramebuffer(a.FRAMEBUFFER,null)}}if(K){e.bindTexture(a.TEXTURE_CUBE_MAP,Q.__webglTexture),ct(a.TEXTURE_CUBE_MAP,S);for(let pt=0;pt<6;pt++)if(S.mipmaps&&S.mipmaps.length>0)for(let St=0;St<S.mipmaps.length;St++)nt(V.__webglFramebuffer[pt][St],I,S,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+pt,St);else nt(V.__webglFramebuffer[pt],I,S,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0);p(S)&&m(a.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(It){for(let pt=0,St=st.length;pt<St;pt++){let he=st[pt],at=i.get(he);e.bindTexture(a.TEXTURE_2D,at.__webglTexture),ct(a.TEXTURE_2D,he),nt(V.__webglFramebuffer,I,he,a.COLOR_ATTACHMENT0+pt,a.TEXTURE_2D,0),p(he)&&m(a.TEXTURE_2D)}e.unbindTexture()}else{let pt=a.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(pt=I.isWebGL3DRenderTarget?a.TEXTURE_3D:a.TEXTURE_2D_ARRAY),e.bindTexture(pt,Q.__webglTexture),ct(pt,S),S.mipmaps&&S.mipmaps.length>0)for(let St=0;St<S.mipmaps.length;St++)nt(V.__webglFramebuffer[St],I,S,a.COLOR_ATTACHMENT0,pt,St);else nt(V.__webglFramebuffer,I,S,a.COLOR_ATTACHMENT0,pt,0);p(S)&&m(pt),e.unbindTexture()}I.depthBuffer&&Nt(I)}function xe(I){let S=I.textures;for(let V=0,Q=S.length;V<Q;V++){let st=S[V];if(p(st)){let K=I.isWebGLCubeRenderTarget?a.TEXTURE_CUBE_MAP:a.TEXTURE_2D,It=i.get(st).__webglTexture;e.bindTexture(K,It),m(K),e.unbindTexture()}}}let oe=[],N=[];function di(I){if(I.samples>0){if(ce(I)===!1){let S=I.textures,V=I.width,Q=I.height,st=a.COLOR_BUFFER_BIT,K=I.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,It=i.get(I),pt=S.length>1;if(pt)for(let St=0;St<S.length;St++)e.bindFramebuffer(a.FRAMEBUFFER,It.__webglMultisampledFramebuffer),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+St,a.RENDERBUFFER,null),e.bindFramebuffer(a.FRAMEBUFFER,It.__webglFramebuffer),a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0+St,a.TEXTURE_2D,null,0);e.bindFramebuffer(a.READ_FRAMEBUFFER,It.__webglMultisampledFramebuffer),e.bindFramebuffer(a.DRAW_FRAMEBUFFER,It.__webglFramebuffer);for(let St=0;St<S.length;St++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(st|=a.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(st|=a.STENCIL_BUFFER_BIT)),pt){a.framebufferRenderbuffer(a.READ_FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.RENDERBUFFER,It.__webglColorRenderbuffer[St]);let he=i.get(S[St]).__webglTexture;a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,he,0)}a.blitFramebuffer(0,0,V,Q,0,0,V,Q,st,a.NEAREST),l===!0&&(oe.length=0,N.length=0,oe.push(a.COLOR_ATTACHMENT0+St),I.depthBuffer&&I.resolveDepthBuffer===!1&&(oe.push(K),N.push(K),a.invalidateFramebuffer(a.DRAW_FRAMEBUFFER,N)),a.invalidateFramebuffer(a.READ_FRAMEBUFFER,oe))}if(e.bindFramebuffer(a.READ_FRAMEBUFFER,null),e.bindFramebuffer(a.DRAW_FRAMEBUFFER,null),pt)for(let St=0;St<S.length;St++){e.bindFramebuffer(a.FRAMEBUFFER,It.__webglMultisampledFramebuffer),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+St,a.RENDERBUFFER,It.__webglColorRenderbuffer[St]);let he=i.get(S[St]).__webglTexture;e.bindFramebuffer(a.FRAMEBUFFER,It.__webglFramebuffer),a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0+St,a.TEXTURE_2D,he,0)}e.bindFramebuffer(a.DRAW_FRAMEBUFFER,It.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.resolveDepthBuffer===!1&&l){let S=I.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT;a.invalidateFramebuffer(a.DRAW_FRAMEBUFFER,[S])}}}function ne(I){return Math.min(n.maxSamples,I.samples)}function ce(I){let S=i.get(I);return I.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function Ht(I){let S=r.render.frame;h.get(I)!==S&&(h.set(I,S),I.update())}function Se(I,S){let V=I.colorSpace,Q=I.format,st=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||V!==xn&&V!==gi&&(me.getTransfer(V)===Te?(Q!==je||st!==li)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),S}function qt(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(c.width=I.naturalWidth||I.width,c.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(c.width=I.displayWidth,c.height=I.displayHeight):(c.width=I.width,c.height=I.height),c}this.allocateTextureUnit=L,this.resetTextureUnits=M,this.setTexture2D=H,this.setTexture2DArray=Y,this.setTexture3D=B,this.setTextureCube=et,this.rebindTextures=Ut,this.setupRenderTarget=ae,this.updateRenderTargetMipmap=xe,this.updateMultisampleRenderTarget=di,this.setupDepthRenderbuffer=Nt,this.setupFrameBufferTexture=nt,this.useMultisampledRTT=ce}function pg(a,t){function e(i,n=gi){let s,r=me.getTransfer(n);if(i===li)return a.UNSIGNED_BYTE;if(i===tc)return a.UNSIGNED_SHORT_4_4_4_4;if(i===ec)return a.UNSIGNED_SHORT_5_5_5_1;if(i===Gh)return a.UNSIGNED_INT_5_9_9_9_REV;if(i===Hh)return a.BYTE;if(i===Vh)return a.SHORT;if(i===Ls)return a.UNSIGNED_SHORT;if(i===Ql)return a.INT;if(i===In)return a.UNSIGNED_INT;if(i===Ui)return a.FLOAT;if(i===Bs)return a.HALF_FLOAT;if(i===Wh)return a.ALPHA;if(i===qh)return a.RGB;if(i===je)return a.RGBA;if(i===Xh)return a.LUMINANCE;if(i===$h)return a.LUMINANCE_ALPHA;if(i===ss)return a.DEPTH_COMPONENT;if(i===ds)return a.DEPTH_STENCIL;if(i===ic)return a.RED;if(i===nc)return a.RED_INTEGER;if(i===Yh)return a.RG;if(i===sc)return a.RG_INTEGER;if(i===rc)return a.RGBA_INTEGER;if(i===Nr||i===zr||i===Ur||i===Or)if(r===Te)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Nr)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===zr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ur)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Or)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Nr)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===zr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ur)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Or)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===qo||i===Xo||i===$o||i===Yo)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===qo)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Xo)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===$o)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Yo)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===jo||i===Zo||i===Ko)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===jo||i===Zo)return r===Te?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Ko)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Jo||i===Qo||i===tl||i===el||i===il||i===nl||i===sl||i===rl||i===al||i===ol||i===ll||i===cl||i===hl||i===dl)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Jo)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Qo)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===tl)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===el)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===il)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===nl)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===sl)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===rl)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===al)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ol)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ll)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===cl)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===hl)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===dl)return r===Te?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Fr||i===ul||i===fl)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===Fr)return r===Te?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ul)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===fl)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===jh||i===pl||i===ml||i===gl)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===Fr)return s.COMPRESSED_RED_RGTC1_EXT;if(i===pl)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===ml)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===gl)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===hs?a.UNSIGNED_INT_24_8:a[i]!==void 0?a[i]:null}return{convert:e}}var Pl=class extends Ge{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},Kt=class extends Ne{constructor(){super(),this.isGroup=!0,this.type="Group"}},mg={type:"move"},Is=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Kt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Kt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Kt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let n=null,s=null,r=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(let y of t.hand.values()){let p=e.getJointPose(y,i),m=this._getHandJoint(c,y);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,g=.005;c.inputState.pinching&&u>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(n=e.getPose(t.targetRaySpace,i),n===null&&s!==null&&(n=s),n!==null&&(o.matrix.fromArray(n.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,n.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(n.linearVelocity)):o.hasLinearVelocity=!1,n.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(n.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(mg)))}return o!==null&&(o.visible=n!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let i=new Kt;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}},gg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,yg=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Il=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,i){if(this.texture===null){let n=new yi,s=t.properties.get(n);s.__webglTexture=e.texture,(e.depthNear!=i.depthNear||e.depthFar!=i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,i=new Si({vertexShader:gg,fragmentShader:yg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new At(new ze(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ll=class extends pn{constructor(t,e){super();let i=this,n=null,s=1,r=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,g=null,y=new Il,p=e.getContextAttributes(),m=null,x=null,v=[],b=[],_=new Xt,A=null,T=new Ge;T.layers.enable(1),T.viewport=new ve;let k=new Ge;k.layers.enable(2),k.viewport=new ve;let D=[T,k],w=new Pl;w.layers.enable(1),w.layers.enable(2);let M=null,L=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let nt=v[j];return nt===void 0&&(nt=new Is,v[j]=nt),nt.getTargetRaySpace()},this.getControllerGrip=function(j){let nt=v[j];return nt===void 0&&(nt=new Is,v[j]=nt),nt.getGripSpace()},this.getHand=function(j){let nt=v[j];return nt===void 0&&(nt=new Is,v[j]=nt),nt.getHandSpace()};function U(j){let nt=b.indexOf(j.inputSource);if(nt===-1)return;let ut=v[nt];ut!==void 0&&(ut.update(j.inputSource,j.frame,c||r),ut.dispatchEvent({type:j.type,data:j.inputSource}))}function H(){n.removeEventListener("select",U),n.removeEventListener("selectstart",U),n.removeEventListener("selectend",U),n.removeEventListener("squeeze",U),n.removeEventListener("squeezestart",U),n.removeEventListener("squeezeend",U),n.removeEventListener("end",H),n.removeEventListener("inputsourceschange",Y);for(let j=0;j<v.length;j++){let nt=b[j];nt!==null&&(b[j]=null,v[j].disconnect(nt))}M=null,L=null,y.reset(),t.setRenderTarget(m),f=null,u=null,d=null,n=null,x=null,Jt.stop(),i.isPresenting=!1,t.setPixelRatio(A),t.setSize(_.width,_.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){s=j,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){o=j,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return n},this.setSession=async function(j){if(n=j,n!==null){if(m=t.getRenderTarget(),n.addEventListener("select",U),n.addEventListener("selectstart",U),n.addEventListener("selectend",U),n.addEventListener("squeeze",U),n.addEventListener("squeezestart",U),n.addEventListener("squeezeend",U),n.addEventListener("end",H),n.addEventListener("inputsourceschange",Y),p.xrCompatible!==!0&&await e.makeXRCompatible(),A=t.getPixelRatio(),t.getSize(_),n.renderState.layers===void 0){let nt={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(n,e,nt),n.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),x=new Ji(f.framebufferWidth,f.framebufferHeight,{format:je,type:li,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let nt=null,ut=null,ft=null;p.depth&&(ft=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,nt=p.stencil?ds:ss,ut=p.stencil?hs:In);let Nt={colorFormat:e.RGBA8,depthFormat:ft,scaleFactor:s};d=new XRWebGLBinding(n,e),u=d.createProjectionLayer(Nt),n.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),x=new Ji(u.textureWidth,u.textureHeight,{format:je,type:li,depthTexture:new ia(u.textureWidth,u.textureHeight,ut,void 0,void 0,void 0,void 0,void 0,void 0,nt),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await n.requestReferenceSpace(o),Jt.setContext(n),Jt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(n!==null)return n.environmentBlendMode},this.getDepthTexture=function(){return y.getDepthTexture()};function Y(j){for(let nt=0;nt<j.removed.length;nt++){let ut=j.removed[nt],ft=b.indexOf(ut);ft>=0&&(b[ft]=null,v[ft].disconnect(ut))}for(let nt=0;nt<j.added.length;nt++){let ut=j.added[nt],ft=b.indexOf(ut);if(ft===-1){for(let Ut=0;Ut<v.length;Ut++)if(Ut>=b.length){b.push(ut),ft=Ut;break}else if(b[Ut]===null){b[Ut]=ut,ft=Ut;break}if(ft===-1)break}let Nt=v[ft];Nt&&Nt.connect(ut)}}let B=new P,et=new P;function q(j,nt,ut){B.setFromMatrixPosition(nt.matrixWorld),et.setFromMatrixPosition(ut.matrixWorld);let ft=B.distanceTo(et),Nt=nt.projectionMatrix.elements,Ut=ut.projectionMatrix.elements,ae=Nt[14]/(Nt[10]-1),xe=Nt[14]/(Nt[10]+1),oe=(Nt[9]+1)/Nt[5],N=(Nt[9]-1)/Nt[5],di=(Nt[8]-1)/Nt[0],ne=(Ut[8]+1)/Ut[0],ce=ae*di,Ht=ae*ne,Se=ft/(-di+ne),qt=Se*-di;if(nt.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(qt),j.translateZ(Se),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),Nt[10]===-1)j.projectionMatrix.copy(nt.projectionMatrix),j.projectionMatrixInverse.copy(nt.projectionMatrixInverse);else{let I=ae+Se,S=xe+Se,V=ce-qt,Q=Ht+(ft-qt),st=oe*xe/S*I,K=N*xe/S*I;j.projectionMatrix.makePerspective(V,Q,st,K,I,S),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function ht(j,nt){nt===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(nt.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(n===null)return;let nt=j.near,ut=j.far;y.texture!==null&&(y.depthNear>0&&(nt=y.depthNear),y.depthFar>0&&(ut=y.depthFar)),w.near=k.near=T.near=nt,w.far=k.far=T.far=ut,(M!==w.near||L!==w.far)&&(n.updateRenderState({depthNear:w.near,depthFar:w.far}),M=w.near,L=w.far);let ft=j.parent,Nt=w.cameras;ht(w,ft);for(let Ut=0;Ut<Nt.length;Ut++)ht(Nt[Ut],ft);Nt.length===2?q(w,T,k):w.projectionMatrix.copy(T.projectionMatrix),it(j,w,ft)};function it(j,nt,ut){ut===null?j.matrix.copy(nt.matrixWorld):(j.matrix.copy(ut.matrixWorld),j.matrix.invert(),j.matrix.multiply(nt.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(nt.projectionMatrix),j.projectionMatrixInverse.copy(nt.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Xr*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return w},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(j){l=j,u!==null&&(u.fixedFoveation=j),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=j)},this.hasDepthSensing=function(){return y.texture!==null},this.getDepthSensingMesh=function(){return y.getMesh(w)};let ct=null;function Wt(j,nt){if(h=nt.getViewerPose(c||r),g=nt,h!==null){let ut=h.views;f!==null&&(t.setRenderTargetFramebuffer(x,f.framebuffer),t.setRenderTarget(x));let ft=!1;ut.length!==w.cameras.length&&(w.cameras.length=0,ft=!0);for(let Ut=0;Ut<ut.length;Ut++){let ae=ut[Ut],xe=null;if(f!==null)xe=f.getViewport(ae);else{let N=d.getViewSubImage(u,ae);xe=N.viewport,Ut===0&&(t.setRenderTargetTextures(x,N.colorTexture,u.ignoreDepthValues?void 0:N.depthStencilTexture),t.setRenderTarget(x))}let oe=D[Ut];oe===void 0&&(oe=new Ge,oe.layers.enable(Ut),oe.viewport=new ve,D[Ut]=oe),oe.matrix.fromArray(ae.transform.matrix),oe.matrix.decompose(oe.position,oe.quaternion,oe.scale),oe.projectionMatrix.fromArray(ae.projectionMatrix),oe.projectionMatrixInverse.copy(oe.projectionMatrix).invert(),oe.viewport.set(xe.x,xe.y,xe.width,xe.height),Ut===0&&(w.matrix.copy(oe.matrix),w.matrix.decompose(w.position,w.quaternion,w.scale)),ft===!0&&w.cameras.push(oe)}let Nt=n.enabledFeatures;if(Nt&&Nt.includes("depth-sensing")){let Ut=d.getDepthInformation(ut[0]);Ut&&Ut.isValid&&Ut.texture&&y.init(t,Ut,n.renderState)}}for(let ut=0;ut<v.length;ut++){let ft=b[ut],Nt=v[ut];ft!==null&&Nt!==void 0&&Nt.update(ft,nt,c||r)}ct&&ct(j,nt),nt.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:nt}),g=null}let Jt=new ed;Jt.setAnimationLoop(Wt),this.setAnimationLoop=function(j){ct=j},this.dispose=function(){}}},Tn=new Be,xg=new Qt;function vg(a,t){function e(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function i(p,m){m.color.getRGB(p.fogColor.value,td(a)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function n(p,m,x,v,b){m.isMeshBasicMaterial||m.isMeshLambertMaterial?s(p,m):m.isMeshToonMaterial?(s(p,m),d(p,m)):m.isMeshPhongMaterial?(s(p,m),h(p,m)):m.isMeshStandardMaterial?(s(p,m),u(p,m),m.isMeshPhysicalMaterial&&f(p,m,b)):m.isMeshMatcapMaterial?(s(p,m),g(p,m)):m.isMeshDepthMaterial?s(p,m):m.isMeshDistanceMaterial?(s(p,m),y(p,m)):m.isMeshNormalMaterial?s(p,m):m.isLineBasicMaterial?(r(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?l(p,m,x,v):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,e(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Ze&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,e(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Ze&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,e(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,e(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let x=t.get(m),v=x.envMap,b=x.envMapRotation;v&&(p.envMap.value=v,Tn.copy(b),Tn.x*=-1,Tn.y*=-1,Tn.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Tn.y*=-1,Tn.z*=-1),p.envMapRotation.value.setFromMatrix4(xg.makeRotationFromEuler(Tn)),p.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,p.aoMapTransform))}function r(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,x,v){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*x,p.scale.value=v*.5,m.map&&(p.map.value=m.map,e(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function d(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function u(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,x){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Ze&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=x.texture,p.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function y(p,m){let x=t.get(m).light;p.referencePosition.value.setFromMatrixPosition(x.matrixWorld),p.nearDistance.value=x.shadow.camera.near,p.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:n}}function bg(a,t,e,i){let n={},s={},r=[],o=a.getParameter(a.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,v){let b=v.program;i.uniformBlockBinding(x,b)}function c(x,v){let b=n[x.id];b===void 0&&(g(x),b=h(x),n[x.id]=b,x.addEventListener("dispose",p));let _=v.program;i.updateUBOMapping(x,_);let A=t.render.frame;s[x.id]!==A&&(u(x),s[x.id]=A)}function h(x){let v=d();x.__bindingPointIndex=v;let b=a.createBuffer(),_=x.__size,A=x.usage;return a.bindBuffer(a.UNIFORM_BUFFER,b),a.bufferData(a.UNIFORM_BUFFER,_,A),a.bindBuffer(a.UNIFORM_BUFFER,null),a.bindBufferBase(a.UNIFORM_BUFFER,v,b),b}function d(){for(let x=0;x<o;x++)if(r.indexOf(x)===-1)return r.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(x){let v=n[x.id],b=x.uniforms,_=x.__cache;a.bindBuffer(a.UNIFORM_BUFFER,v);for(let A=0,T=b.length;A<T;A++){let k=Array.isArray(b[A])?b[A]:[b[A]];for(let D=0,w=k.length;D<w;D++){let M=k[D];if(f(M,A,D,_)===!0){let L=M.__offset,U=Array.isArray(M.value)?M.value:[M.value],H=0;for(let Y=0;Y<U.length;Y++){let B=U[Y],et=y(B);typeof B=="number"||typeof B=="boolean"?(M.__data[0]=B,a.bufferSubData(a.UNIFORM_BUFFER,L+H,M.__data)):B.isMatrix3?(M.__data[0]=B.elements[0],M.__data[1]=B.elements[1],M.__data[2]=B.elements[2],M.__data[3]=0,M.__data[4]=B.elements[3],M.__data[5]=B.elements[4],M.__data[6]=B.elements[5],M.__data[7]=0,M.__data[8]=B.elements[6],M.__data[9]=B.elements[7],M.__data[10]=B.elements[8],M.__data[11]=0):(B.toArray(M.__data,H),H+=et.storage/Float32Array.BYTES_PER_ELEMENT)}a.bufferSubData(a.UNIFORM_BUFFER,L,M.__data)}}}a.bindBuffer(a.UNIFORM_BUFFER,null)}function f(x,v,b,_){let A=x.value,T=v+"_"+b;if(_[T]===void 0)return typeof A=="number"||typeof A=="boolean"?_[T]=A:_[T]=A.clone(),!0;{let k=_[T];if(typeof A=="number"||typeof A=="boolean"){if(k!==A)return _[T]=A,!0}else if(k.equals(A)===!1)return k.copy(A),!0}return!1}function g(x){let v=x.uniforms,b=0,_=16;for(let T=0,k=v.length;T<k;T++){let D=Array.isArray(v[T])?v[T]:[v[T]];for(let w=0,M=D.length;w<M;w++){let L=D[w],U=Array.isArray(L.value)?L.value:[L.value];for(let H=0,Y=U.length;H<Y;H++){let B=U[H],et=y(B),q=b%_,ht=q%et.boundary,it=q+ht;b+=ht,it!==0&&_-it<et.storage&&(b+=_-it),L.__data=new Float32Array(et.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=b,b+=et.storage}}}let A=b%_;return A>0&&(b+=_-A),x.__size=b,x.__cache={},this}function y(x){let v={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(v.boundary=4,v.storage=4):x.isVector2?(v.boundary=8,v.storage=8):x.isVector3||x.isColor?(v.boundary=16,v.storage=12):x.isVector4?(v.boundary=16,v.storage=16):x.isMatrix3?(v.boundary=48,v.storage=48):x.isMatrix4?(v.boundary=64,v.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),v}function p(x){let v=x.target;v.removeEventListener("dispose",p);let b=r.indexOf(v.__bindingPointIndex);r.splice(b,1),a.deleteBuffer(n[v.id]),delete n[v.id],delete s[v.id]}function m(){for(let x in n)a.deleteBuffer(n[x]);r=[],n={},s={}}return{bind:l,update:c,dispose:m}}var na=class{constructor(t={}){let{canvas:e=_u(),context:i=null,depth:n=!0,stencil:s=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1}=t;this.isWebGLRenderer=!0;let u;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=i.getContextAttributes().alpha}else u=r;let f=new Uint32Array(4),g=new Int32Array(4),y=null,p=null,m=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ye,this.toneMapping=fn,this.toneMappingExposure=1;let v=this,b=!1,_=0,A=0,T=null,k=-1,D=null,w=new ve,M=new ve,L=null,U=new mt(0),H=0,Y=e.width,B=e.height,et=1,q=null,ht=null,it=new ve(0,0,Y,B),ct=new ve(0,0,Y,B),Wt=!1,Jt=new zs,j=!1,nt=!1,ut=new Qt,ft=new Qt,Nt=new P,Ut=new ve,ae={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},xe=!1;function oe(){return T===null?et:1}let N=i;function di(R,O){return e.getContext(R,O)}try{let R={alpha:!0,depth:n,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Zl}`),e.addEventListener("webglcontextlost",tt,!1),e.addEventListener("webglcontextrestored",yt,!1),e.addEventListener("webglcontextcreationerror",_t,!1),N===null){let O="webgl2";if(N=di(O,R),N===null)throw di(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(R){throw console.error("THREE.WebGLRenderer: "+R.message),R}let ne,ce,Ht,Se,qt,I,S,V,Q,st,K,It,pt,St,he,at,Et,Vt,Gt,Tt,se,Yt,we,z;function wt(){ne=new z0(N),ne.init(),Yt=new pg(N,ne),ce=new k0(N,ne,t,Yt),Ht=new dg(N),ce.reverseDepthBuffer&&Ht.buffers.depth.setReversed(!0),Se=new F0(N),qt=new Jm,I=new fg(N,ne,Ht,qt,ce,Yt,Se),S=new I0(v),V=new N0(v),Q=new qu(N),we=new R0(N,Q),st=new U0(N,Q,Se,we),K=new H0(N,st,Q,Se),Gt=new B0(N,ce,I),at=new P0(qt),It=new Km(v,S,V,ne,ce,we,at),pt=new vg(v,qt),St=new tg,he=new ag(ne),Vt=new A0(v,S,V,Ht,K,u,l),Et=new cg(v,K,ce),z=new bg(N,Se,ce,Ht),Tt=new C0(N,ne,Se),se=new O0(N,ne,Se),Se.programs=It.programs,v.capabilities=ce,v.extensions=ne,v.properties=qt,v.renderLists=St,v.shadowMap=Et,v.state=Ht,v.info=Se}wt();let $=new Ll(v,N);this.xr=$,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let R=ne.get("WEBGL_lose_context");R&&R.loseContext()},this.forceContextRestore=function(){let R=ne.get("WEBGL_lose_context");R&&R.restoreContext()},this.getPixelRatio=function(){return et},this.setPixelRatio=function(R){R!==void 0&&(et=R,this.setSize(Y,B,!1))},this.getSize=function(R){return R.set(Y,B)},this.setSize=function(R,O,G=!0){if($.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=R,B=O,e.width=Math.floor(R*et),e.height=Math.floor(O*et),G===!0&&(e.style.width=R+"px",e.style.height=O+"px"),this.setViewport(0,0,R,O)},this.getDrawingBufferSize=function(R){return R.set(Y*et,B*et).floor()},this.setDrawingBufferSize=function(R,O,G){Y=R,B=O,et=G,e.width=Math.floor(R*G),e.height=Math.floor(O*G),this.setViewport(0,0,R,O)},this.getCurrentViewport=function(R){return R.copy(w)},this.getViewport=function(R){return R.copy(it)},this.setViewport=function(R,O,G,W){R.isVector4?it.set(R.x,R.y,R.z,R.w):it.set(R,O,G,W),Ht.viewport(w.copy(it).multiplyScalar(et).round())},this.getScissor=function(R){return R.copy(ct)},this.setScissor=function(R,O,G,W){R.isVector4?ct.set(R.x,R.y,R.z,R.w):ct.set(R,O,G,W),Ht.scissor(M.copy(ct).multiplyScalar(et).round())},this.getScissorTest=function(){return Wt},this.setScissorTest=function(R){Ht.setScissorTest(Wt=R)},this.setOpaqueSort=function(R){q=R},this.setTransparentSort=function(R){ht=R},this.getClearColor=function(R){return R.copy(Vt.getClearColor())},this.setClearColor=function(){Vt.setClearColor.apply(Vt,arguments)},this.getClearAlpha=function(){return Vt.getClearAlpha()},this.setClearAlpha=function(){Vt.setClearAlpha.apply(Vt,arguments)},this.clear=function(R=!0,O=!0,G=!0){let W=0;if(R){let F=!1;if(T!==null){let lt=T.texture.format;F=lt===rc||lt===sc||lt===nc}if(F){let lt=T.texture.type,xt=lt===li||lt===In||lt===Ls||lt===hs||lt===tc||lt===ec,Ct=Vt.getClearColor(),kt=Vt.getClearAlpha(),zt=Ct.r,Ot=Ct.g,Lt=Ct.b;xt?(f[0]=zt,f[1]=Ot,f[2]=Lt,f[3]=kt,N.clearBufferuiv(N.COLOR,0,f)):(g[0]=zt,g[1]=Ot,g[2]=Lt,g[3]=kt,N.clearBufferiv(N.COLOR,0,g))}else W|=N.COLOR_BUFFER_BIT}O&&(W|=N.DEPTH_BUFFER_BIT,N.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),G&&(W|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",tt,!1),e.removeEventListener("webglcontextrestored",yt,!1),e.removeEventListener("webglcontextcreationerror",_t,!1),St.dispose(),he.dispose(),qt.dispose(),S.dispose(),V.dispose(),K.dispose(),we.dispose(),z.dispose(),It.dispose(),$.dispose(),$.removeEventListener("sessionstart",Tc),$.removeEventListener("sessionend",Ac),bn.stop()};function tt(R){R.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function yt(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;let R=Se.autoReset,O=Et.enabled,G=Et.autoUpdate,W=Et.needsUpdate,F=Et.type;wt(),Se.autoReset=R,Et.enabled=O,Et.autoUpdate=G,Et.needsUpdate=W,Et.type=F}function _t(R){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",R.statusMessage)}function le(R){let O=R.target;O.removeEventListener("dispose",le),Le(O)}function Le(R){ni(R),qt.remove(R)}function ni(R){let O=qt.get(R).programs;O!==void 0&&(O.forEach(function(G){It.releaseProgram(G)}),R.isShaderMaterial&&It.releaseShaderCache(R))}this.renderBufferDirect=function(R,O,G,W,F,lt){O===null&&(O=ae);let xt=F.isMesh&&F.matrixWorld.determinant()<0,Ct=Id(R,O,G,W,F);Ht.setMaterial(W,xt);let kt=G.index,zt=1;if(W.wireframe===!0){if(kt=st.getWireframeAttribute(G),kt===void 0)return;zt=2}let Ot=G.drawRange,Lt=G.attributes.position,ge=Ot.start*zt,Ee=(Ot.start+Ot.count)*zt;lt!==null&&(ge=Math.max(ge,lt.start*zt),Ee=Math.min(Ee,(lt.start+lt.count)*zt)),kt!==null?(ge=Math.max(ge,0),Ee=Math.min(Ee,kt.count)):Lt!=null&&(ge=Math.max(ge,0),Ee=Math.min(Ee,Lt.count));let Re=Ee-ge;if(Re<0||Re===1/0)return;we.setup(F,W,Ct,G,kt);let ui,fe=Tt;if(kt!==null&&(ui=Q.get(kt),fe=se,fe.setIndex(ui)),F.isMesh)W.wireframe===!0?(Ht.setLineWidth(W.wireframeLinewidth*oe()),fe.setMode(N.LINES)):fe.setMode(N.TRIANGLES);else if(F.isLine){let Dt=W.linewidth;Dt===void 0&&(Dt=1),Ht.setLineWidth(Dt*oe()),F.isLineSegments?fe.setMode(N.LINES):F.isLineLoop?fe.setMode(N.LINE_LOOP):fe.setMode(N.LINE_STRIP)}else F.isPoints?fe.setMode(N.POINTS):F.isSprite&&fe.setMode(N.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)fe.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(ne.get("WEBGL_multi_draw"))fe.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{let Dt=F._multiDrawStarts,Ve=F._multiDrawCounts,pe=F._multiDrawCount,Ai=kt?Q.get(kt).bytesPerElement:1,Bn=qt.get(W).currentProgram.getUniforms();for(let fi=0;fi<pe;fi++)Bn.setValue(N,"_gl_DrawID",fi),fe.render(Dt[fi]/Ai,Ve[fi])}else if(F.isInstancedMesh)fe.renderInstances(ge,Re,F.count);else if(G.isInstancedBufferGeometry){let Dt=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,Ve=Math.min(G.instanceCount,Dt);fe.renderInstances(ge,Re,Ve)}else fe.render(ge,Re)};function ue(R,O,G){R.transparent===!0&&R.side===_e&&R.forceSinglePass===!1?(R.side=Ze,R.needsUpdate=!0,cr(R,O,G),R.side=Ii,R.needsUpdate=!0,cr(R,O,G),R.side=_e):cr(R,O,G)}this.compile=function(R,O,G=null){G===null&&(G=R),p=he.get(G),p.init(O),x.push(p),G.traverseVisible(function(F){F.isLight&&F.layers.test(O.layers)&&(p.pushLight(F),F.castShadow&&p.pushShadow(F))}),R!==G&&R.traverseVisible(function(F){F.isLight&&F.layers.test(O.layers)&&(p.pushLight(F),F.castShadow&&p.pushShadow(F))}),p.setupLights();let W=new Set;return R.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;let lt=F.material;if(lt)if(Array.isArray(lt))for(let xt=0;xt<lt.length;xt++){let Ct=lt[xt];ue(Ct,G,F),W.add(Ct)}else ue(lt,G,F),W.add(lt)}),x.pop(),p=null,W},this.compileAsync=function(R,O,G=null){let W=this.compile(R,O,G);return new Promise(F=>{function lt(){if(W.forEach(function(xt){qt.get(xt).currentProgram.isReady()&&W.delete(xt)}),W.size===0){F(R);return}setTimeout(lt,10)}ne.get("KHR_parallel_shader_compile")!==null?lt():setTimeout(lt,10)})};let si=null;function Vi(R){si&&si(R)}function Tc(){bn.stop()}function Ac(){bn.start()}let bn=new ed;bn.setAnimationLoop(Vi),typeof self<"u"&&bn.setContext(self),this.setAnimationLoop=function(R){si=R,$.setAnimationLoop(R),R===null?bn.stop():bn.start()},$.addEventListener("sessionstart",Tc),$.addEventListener("sessionend",Ac),this.render=function(R,O){if(O!==void 0&&O.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;if(R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),$.enabled===!0&&$.isPresenting===!0&&($.cameraAutoUpdate===!0&&$.updateCamera(O),O=$.getCamera()),R.isScene===!0&&R.onBeforeRender(v,R,O,T),p=he.get(R,x.length),p.init(O),x.push(p),ft.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),Jt.setFromProjectionMatrix(ft),nt=this.localClippingEnabled,j=at.init(this.clippingPlanes,nt),y=St.get(R,m.length),y.init(),m.push(y),$.enabled===!0&&$.isPresenting===!0){let lt=v.xr.getDepthSensingMesh();lt!==null&&ja(lt,O,-1/0,v.sortObjects)}ja(R,O,0,v.sortObjects),y.finish(),v.sortObjects===!0&&y.sort(q,ht),xe=$.enabled===!1||$.isPresenting===!1||$.hasDepthSensing()===!1,xe&&Vt.addToRenderList(y,R),this.info.render.frame++,j===!0&&at.beginShadows();let G=p.state.shadowsArray;Et.render(G,R,O),j===!0&&at.endShadows(),this.info.autoReset===!0&&this.info.reset();let W=y.opaque,F=y.transmissive;if(p.setupLights(),O.isArrayCamera){let lt=O.cameras;if(F.length>0)for(let xt=0,Ct=lt.length;xt<Ct;xt++){let kt=lt[xt];Cc(W,F,R,kt)}xe&&Vt.render(R);for(let xt=0,Ct=lt.length;xt<Ct;xt++){let kt=lt[xt];Rc(y,R,kt,kt.viewport)}}else F.length>0&&Cc(W,F,R,O),xe&&Vt.render(R),Rc(y,R,O);T!==null&&(I.updateMultisampleRenderTarget(T),I.updateRenderTargetMipmap(T)),R.isScene===!0&&R.onAfterRender(v,R,O),we.resetDefaultState(),k=-1,D=null,x.pop(),x.length>0?(p=x[x.length-1],j===!0&&at.setGlobalState(v.clippingPlanes,p.state.camera)):p=null,m.pop(),m.length>0?y=m[m.length-1]:y=null};function ja(R,O,G,W){if(R.visible===!1)return;if(R.layers.test(O.layers)){if(R.isGroup)G=R.renderOrder;else if(R.isLOD)R.autoUpdate===!0&&R.update(O);else if(R.isLight)p.pushLight(R),R.castShadow&&p.pushShadow(R);else if(R.isSprite){if(!R.frustumCulled||Jt.intersectsSprite(R)){W&&Ut.setFromMatrixPosition(R.matrixWorld).applyMatrix4(ft);let xt=K.update(R),Ct=R.material;Ct.visible&&y.push(R,xt,Ct,G,Ut.z,null)}}else if((R.isMesh||R.isLine||R.isPoints)&&(!R.frustumCulled||Jt.intersectsObject(R))){let xt=K.update(R),Ct=R.material;if(W&&(R.boundingSphere!==void 0?(R.boundingSphere===null&&R.computeBoundingSphere(),Ut.copy(R.boundingSphere.center)):(xt.boundingSphere===null&&xt.computeBoundingSphere(),Ut.copy(xt.boundingSphere.center)),Ut.applyMatrix4(R.matrixWorld).applyMatrix4(ft)),Array.isArray(Ct)){let kt=xt.groups;for(let zt=0,Ot=kt.length;zt<Ot;zt++){let Lt=kt[zt],ge=Ct[Lt.materialIndex];ge&&ge.visible&&y.push(R,xt,ge,G,Ut.z,Lt)}}else Ct.visible&&y.push(R,xt,Ct,G,Ut.z,null)}}let lt=R.children;for(let xt=0,Ct=lt.length;xt<Ct;xt++)ja(lt[xt],O,G,W)}function Rc(R,O,G,W){let F=R.opaque,lt=R.transmissive,xt=R.transparent;p.setupLightsView(G),j===!0&&at.setGlobalState(v.clippingPlanes,G),W&&Ht.viewport(w.copy(W)),F.length>0&&lr(F,O,G),lt.length>0&&lr(lt,O,G),xt.length>0&&lr(xt,O,G),Ht.buffers.depth.setTest(!0),Ht.buffers.depth.setMask(!0),Ht.buffers.color.setMask(!0),Ht.setPolygonOffset(!1)}function Cc(R,O,G,W){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[W.id]===void 0&&(p.state.transmissionRenderTarget[W.id]=new Ji(1,1,{generateMipmaps:!0,type:ne.has("EXT_color_buffer_half_float")||ne.has("EXT_color_buffer_float")?Bs:li,minFilter:Pi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:me.workingColorSpace}));let lt=p.state.transmissionRenderTarget[W.id],xt=W.viewport||w;lt.setSize(xt.z,xt.w);let Ct=v.getRenderTarget();v.setRenderTarget(lt),v.getClearColor(U),H=v.getClearAlpha(),H<1&&v.setClearColor(16777215,.5),v.clear(),xe&&Vt.render(G);let kt=v.toneMapping;v.toneMapping=fn;let zt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),p.setupLightsView(W),j===!0&&at.setGlobalState(v.clippingPlanes,W),lr(R,G,W),I.updateMultisampleRenderTarget(lt),I.updateRenderTargetMipmap(lt),ne.has("WEBGL_multisampled_render_to_texture")===!1){let Ot=!1;for(let Lt=0,ge=O.length;Lt<ge;Lt++){let Ee=O[Lt],Re=Ee.object,ui=Ee.geometry,fe=Ee.material,Dt=Ee.group;if(fe.side===_e&&Re.layers.test(W.layers)){let Ve=fe.side;fe.side=Ze,fe.needsUpdate=!0,kc(Re,G,W,ui,fe,Dt),fe.side=Ve,fe.needsUpdate=!0,Ot=!0}}Ot===!0&&(I.updateMultisampleRenderTarget(lt),I.updateRenderTargetMipmap(lt))}v.setRenderTarget(Ct),v.setClearColor(U,H),zt!==void 0&&(W.viewport=zt),v.toneMapping=kt}function lr(R,O,G){let W=O.isScene===!0?O.overrideMaterial:null;for(let F=0,lt=R.length;F<lt;F++){let xt=R[F],Ct=xt.object,kt=xt.geometry,zt=W===null?xt.material:W,Ot=xt.group;Ct.layers.test(G.layers)&&kc(Ct,O,G,kt,zt,Ot)}}function kc(R,O,G,W,F,lt){R.onBeforeRender(v,O,G,W,F,lt),R.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,R.matrixWorld),R.normalMatrix.getNormalMatrix(R.modelViewMatrix),F.onBeforeRender(v,O,G,W,R,lt),F.transparent===!0&&F.side===_e&&F.forceSinglePass===!1?(F.side=Ze,F.needsUpdate=!0,v.renderBufferDirect(G,O,W,F,R,lt),F.side=Ii,F.needsUpdate=!0,v.renderBufferDirect(G,O,W,F,R,lt),F.side=_e):v.renderBufferDirect(G,O,W,F,R,lt),R.onAfterRender(v,O,G,W,F,lt)}function cr(R,O,G){O.isScene!==!0&&(O=ae);let W=qt.get(R),F=p.state.lights,lt=p.state.shadowsArray,xt=F.state.version,Ct=It.getParameters(R,F.state,lt,O,G),kt=It.getProgramCacheKey(Ct),zt=W.programs;W.environment=R.isMeshStandardMaterial?O.environment:null,W.fog=O.fog,W.envMap=(R.isMeshStandardMaterial?V:S).get(R.envMap||W.environment),W.envMapRotation=W.environment!==null&&R.envMap===null?O.environmentRotation:R.envMapRotation,zt===void 0&&(R.addEventListener("dispose",le),zt=new Map,W.programs=zt);let Ot=zt.get(kt);if(Ot!==void 0){if(W.currentProgram===Ot&&W.lightsStateVersion===xt)return Ic(R,Ct),Ot}else Ct.uniforms=It.getUniforms(R),R.onBeforeCompile(Ct,v),Ot=It.acquireProgram(Ct,kt),zt.set(kt,Ot),W.uniforms=Ct.uniforms;let Lt=W.uniforms;return(!R.isShaderMaterial&&!R.isRawShaderMaterial||R.clipping===!0)&&(Lt.clippingPlanes=at.uniform),Ic(R,Ct),W.needsLights=Dd(R),W.lightsStateVersion=xt,W.needsLights&&(Lt.ambientLightColor.value=F.state.ambient,Lt.lightProbe.value=F.state.probe,Lt.directionalLights.value=F.state.directional,Lt.directionalLightShadows.value=F.state.directionalShadow,Lt.spotLights.value=F.state.spot,Lt.spotLightShadows.value=F.state.spotShadow,Lt.rectAreaLights.value=F.state.rectArea,Lt.ltc_1.value=F.state.rectAreaLTC1,Lt.ltc_2.value=F.state.rectAreaLTC2,Lt.pointLights.value=F.state.point,Lt.pointLightShadows.value=F.state.pointShadow,Lt.hemisphereLights.value=F.state.hemi,Lt.directionalShadowMap.value=F.state.directionalShadowMap,Lt.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Lt.spotShadowMap.value=F.state.spotShadowMap,Lt.spotLightMatrix.value=F.state.spotLightMatrix,Lt.spotLightMap.value=F.state.spotLightMap,Lt.pointShadowMap.value=F.state.pointShadowMap,Lt.pointShadowMatrix.value=F.state.pointShadowMatrix),W.currentProgram=Ot,W.uniformsList=null,Ot}function Pc(R){if(R.uniformsList===null){let O=R.currentProgram.getUniforms();R.uniformsList=as.seqWithValue(O.seq,R.uniforms)}return R.uniformsList}function Ic(R,O){let G=qt.get(R);G.outputColorSpace=O.outputColorSpace,G.batching=O.batching,G.batchingColor=O.batchingColor,G.instancing=O.instancing,G.instancingColor=O.instancingColor,G.instancingMorph=O.instancingMorph,G.skinning=O.skinning,G.morphTargets=O.morphTargets,G.morphNormals=O.morphNormals,G.morphColors=O.morphColors,G.morphTargetsCount=O.morphTargetsCount,G.numClippingPlanes=O.numClippingPlanes,G.numIntersection=O.numClipIntersection,G.vertexAlphas=O.vertexAlphas,G.vertexTangents=O.vertexTangents,G.toneMapping=O.toneMapping}function Id(R,O,G,W,F){O.isScene!==!0&&(O=ae),I.resetTextureUnits();let lt=O.fog,xt=W.isMeshStandardMaterial?O.environment:null,Ct=T===null?v.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:xn,kt=(W.isMeshStandardMaterial?V:S).get(W.envMap||xt),zt=W.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ot=!!G.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Lt=!!G.morphAttributes.position,ge=!!G.morphAttributes.normal,Ee=!!G.morphAttributes.color,Re=fn;W.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(Re=v.toneMapping);let ui=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,fe=ui!==void 0?ui.length:0,Dt=qt.get(W),Ve=p.state.lights;if(j===!0&&(nt===!0||R!==D)){let wi=R===D&&W.id===k;at.setState(W,R,wi)}let pe=!1;W.version===Dt.__version?(Dt.needsLights&&Dt.lightsStateVersion!==Ve.state.version||Dt.outputColorSpace!==Ct||F.isBatchedMesh&&Dt.batching===!1||!F.isBatchedMesh&&Dt.batching===!0||F.isBatchedMesh&&Dt.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&Dt.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&Dt.instancing===!1||!F.isInstancedMesh&&Dt.instancing===!0||F.isSkinnedMesh&&Dt.skinning===!1||!F.isSkinnedMesh&&Dt.skinning===!0||F.isInstancedMesh&&Dt.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Dt.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&Dt.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&Dt.instancingMorph===!1&&F.morphTexture!==null||Dt.envMap!==kt||W.fog===!0&&Dt.fog!==lt||Dt.numClippingPlanes!==void 0&&(Dt.numClippingPlanes!==at.numPlanes||Dt.numIntersection!==at.numIntersection)||Dt.vertexAlphas!==zt||Dt.vertexTangents!==Ot||Dt.morphTargets!==Lt||Dt.morphNormals!==ge||Dt.morphColors!==Ee||Dt.toneMapping!==Re||Dt.morphTargetsCount!==fe)&&(pe=!0):(pe=!0,Dt.__version=W.version);let Ai=Dt.currentProgram;pe===!0&&(Ai=cr(W,O,F));let Bn=!1,fi=!1,Za=!1,Pe=Ai.getUniforms(),rn=Dt.uniforms;if(Ht.useProgram(Ai.program)&&(Bn=!0,fi=!0,Za=!0),W.id!==k&&(k=W.id,fi=!0),Bn||D!==R){ce.reverseDepthBuffer?(ut.copy(R.projectionMatrix),Su(ut),Eu(ut),Pe.setValue(N,"projectionMatrix",ut)):Pe.setValue(N,"projectionMatrix",R.projectionMatrix),Pe.setValue(N,"viewMatrix",R.matrixWorldInverse);let wi=Pe.map.cameraPosition;wi!==void 0&&wi.setValue(N,Nt.setFromMatrixPosition(R.matrixWorld)),ce.logarithmicDepthBuffer&&Pe.setValue(N,"logDepthBufFC",2/(Math.log(R.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&Pe.setValue(N,"isOrthographic",R.isOrthographicCamera===!0),D!==R&&(D=R,fi=!0,Za=!0)}if(F.isSkinnedMesh){Pe.setOptional(N,F,"bindMatrix"),Pe.setOptional(N,F,"bindMatrixInverse");let wi=F.skeleton;wi&&(wi.boneTexture===null&&wi.computeBoneTexture(),Pe.setValue(N,"boneTexture",wi.boneTexture,I))}F.isBatchedMesh&&(Pe.setOptional(N,F,"batchingTexture"),Pe.setValue(N,"batchingTexture",F._matricesTexture,I),Pe.setOptional(N,F,"batchingIdTexture"),Pe.setValue(N,"batchingIdTexture",F._indirectTexture,I),Pe.setOptional(N,F,"batchingColorTexture"),F._colorsTexture!==null&&Pe.setValue(N,"batchingColorTexture",F._colorsTexture,I));let Ka=G.morphAttributes;if((Ka.position!==void 0||Ka.normal!==void 0||Ka.color!==void 0)&&Gt.update(F,G,Ai),(fi||Dt.receiveShadow!==F.receiveShadow)&&(Dt.receiveShadow=F.receiveShadow,Pe.setValue(N,"receiveShadow",F.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(rn.envMap.value=kt,rn.flipEnvMap.value=kt.isCubeTexture&&kt.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&O.environment!==null&&(rn.envMapIntensity.value=O.environmentIntensity),fi&&(Pe.setValue(N,"toneMappingExposure",v.toneMappingExposure),Dt.needsLights&&Ld(rn,Za),lt&&W.fog===!0&&pt.refreshFogUniforms(rn,lt),pt.refreshMaterialUniforms(rn,W,et,B,p.state.transmissionRenderTarget[R.id]),as.upload(N,Pc(Dt),rn,I)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(as.upload(N,Pc(Dt),rn,I),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&Pe.setValue(N,"center",F.center),Pe.setValue(N,"modelViewMatrix",F.modelViewMatrix),Pe.setValue(N,"normalMatrix",F.normalMatrix),Pe.setValue(N,"modelMatrix",F.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){let wi=W.uniformsGroups;for(let Ja=0,Nd=wi.length;Ja<Nd;Ja++){let Lc=wi[Ja];z.update(Lc,Ai),z.bind(Lc,Ai)}}return Ai}function Ld(R,O){R.ambientLightColor.needsUpdate=O,R.lightProbe.needsUpdate=O,R.directionalLights.needsUpdate=O,R.directionalLightShadows.needsUpdate=O,R.pointLights.needsUpdate=O,R.pointLightShadows.needsUpdate=O,R.spotLights.needsUpdate=O,R.spotLightShadows.needsUpdate=O,R.rectAreaLights.needsUpdate=O,R.hemisphereLights.needsUpdate=O}function Dd(R){return R.isMeshLambertMaterial||R.isMeshToonMaterial||R.isMeshPhongMaterial||R.isMeshStandardMaterial||R.isShadowMaterial||R.isShaderMaterial&&R.lights===!0}this.getActiveCubeFace=function(){return _},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(R,O,G){qt.get(R.texture).__webglTexture=O,qt.get(R.depthTexture).__webglTexture=G;let W=qt.get(R);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=G===void 0,W.__autoAllocateDepthBuffer||ne.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(R,O){let G=qt.get(R);G.__webglFramebuffer=O,G.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(R,O=0,G=0){T=R,_=O,A=G;let W=!0,F=null,lt=!1,xt=!1;if(R){let kt=qt.get(R);if(kt.__useDefaultFramebuffer!==void 0)Ht.bindFramebuffer(N.FRAMEBUFFER,null),W=!1;else if(kt.__webglFramebuffer===void 0)I.setupRenderTarget(R);else if(kt.__hasExternalTextures)I.rebindTextures(R,qt.get(R.texture).__webglTexture,qt.get(R.depthTexture).__webglTexture);else if(R.depthBuffer){let Lt=R.depthTexture;if(kt.__boundDepthTexture!==Lt){if(Lt!==null&&qt.has(Lt)&&(R.width!==Lt.image.width||R.height!==Lt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");I.setupDepthRenderbuffer(R)}}let zt=R.texture;(zt.isData3DTexture||zt.isDataArrayTexture||zt.isCompressedArrayTexture)&&(xt=!0);let Ot=qt.get(R).__webglFramebuffer;R.isWebGLCubeRenderTarget?(Array.isArray(Ot[O])?F=Ot[O][G]:F=Ot[O],lt=!0):R.samples>0&&I.useMultisampledRTT(R)===!1?F=qt.get(R).__webglMultisampledFramebuffer:Array.isArray(Ot)?F=Ot[G]:F=Ot,w.copy(R.viewport),M.copy(R.scissor),L=R.scissorTest}else w.copy(it).multiplyScalar(et).floor(),M.copy(ct).multiplyScalar(et).floor(),L=Wt;if(Ht.bindFramebuffer(N.FRAMEBUFFER,F)&&W&&Ht.drawBuffers(R,F),Ht.viewport(w),Ht.scissor(M),Ht.setScissorTest(L),lt){let kt=qt.get(R.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+O,kt.__webglTexture,G)}else if(xt){let kt=qt.get(R.texture),zt=O||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,kt.__webglTexture,G||0,zt)}k=-1},this.readRenderTargetPixels=function(R,O,G,W,F,lt,xt){if(!(R&&R.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ct=qt.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&xt!==void 0&&(Ct=Ct[xt]),Ct){Ht.bindFramebuffer(N.FRAMEBUFFER,Ct);try{let kt=R.texture,zt=kt.format,Ot=kt.type;if(!ce.textureFormatReadable(zt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!ce.textureTypeReadable(Ot)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=R.width-W&&G>=0&&G<=R.height-F&&N.readPixels(O,G,W,F,Yt.convert(zt),Yt.convert(Ot),lt)}finally{let kt=T!==null?qt.get(T).__webglFramebuffer:null;Ht.bindFramebuffer(N.FRAMEBUFFER,kt)}}},this.readRenderTargetPixelsAsync=async function(R,O,G,W,F,lt,xt){if(!(R&&R.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ct=qt.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&xt!==void 0&&(Ct=Ct[xt]),Ct){let kt=R.texture,zt=kt.format,Ot=kt.type;if(!ce.textureFormatReadable(zt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!ce.textureTypeReadable(Ot))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(O>=0&&O<=R.width-W&&G>=0&&G<=R.height-F){Ht.bindFramebuffer(N.FRAMEBUFFER,Ct);let Lt=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,Lt),N.bufferData(N.PIXEL_PACK_BUFFER,lt.byteLength,N.STREAM_READ),N.readPixels(O,G,W,F,Yt.convert(zt),Yt.convert(Ot),0);let ge=T!==null?qt.get(T).__webglFramebuffer:null;Ht.bindFramebuffer(N.FRAMEBUFFER,ge);let Ee=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await Mu(N,Ee,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,Lt),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,lt),N.deleteBuffer(Lt),N.deleteSync(Ee),lt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(R,O=null,G=0){R.isTexture!==!0&&(Br("WebGLRenderer: copyFramebufferToTexture function signature has changed."),O=arguments[0]||null,R=arguments[1]);let W=Math.pow(2,-G),F=Math.floor(R.image.width*W),lt=Math.floor(R.image.height*W),xt=O!==null?O.x:0,Ct=O!==null?O.y:0;I.setTexture2D(R,0),N.copyTexSubImage2D(N.TEXTURE_2D,G,0,0,xt,Ct,F,lt),Ht.unbindTexture()},this.copyTextureToTexture=function(R,O,G=null,W=null,F=0){R.isTexture!==!0&&(Br("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,R=arguments[1],O=arguments[2],F=arguments[3]||0,G=null);let lt,xt,Ct,kt,zt,Ot;G!==null?(lt=G.max.x-G.min.x,xt=G.max.y-G.min.y,Ct=G.min.x,kt=G.min.y):(lt=R.image.width,xt=R.image.height,Ct=0,kt=0),W!==null?(zt=W.x,Ot=W.y):(zt=0,Ot=0);let Lt=Yt.convert(O.format),ge=Yt.convert(O.type);I.setTexture2D(O,0),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,O.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,O.unpackAlignment);let Ee=N.getParameter(N.UNPACK_ROW_LENGTH),Re=N.getParameter(N.UNPACK_IMAGE_HEIGHT),ui=N.getParameter(N.UNPACK_SKIP_PIXELS),fe=N.getParameter(N.UNPACK_SKIP_ROWS),Dt=N.getParameter(N.UNPACK_SKIP_IMAGES),Ve=R.isCompressedTexture?R.mipmaps[F]:R.image;N.pixelStorei(N.UNPACK_ROW_LENGTH,Ve.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Ve.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Ct),N.pixelStorei(N.UNPACK_SKIP_ROWS,kt),R.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,F,zt,Ot,lt,xt,Lt,ge,Ve.data):R.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,F,zt,Ot,Ve.width,Ve.height,Lt,Ve.data):N.texSubImage2D(N.TEXTURE_2D,F,zt,Ot,lt,xt,Lt,ge,Ve),N.pixelStorei(N.UNPACK_ROW_LENGTH,Ee),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Re),N.pixelStorei(N.UNPACK_SKIP_PIXELS,ui),N.pixelStorei(N.UNPACK_SKIP_ROWS,fe),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Dt),F===0&&O.generateMipmaps&&N.generateMipmap(N.TEXTURE_2D),Ht.unbindTexture()},this.copyTextureToTexture3D=function(R,O,G=null,W=null,F=0){R.isTexture!==!0&&(Br("WebGLRenderer: copyTextureToTexture3D function signature has changed."),G=arguments[0]||null,W=arguments[1]||null,R=arguments[2],O=arguments[3],F=arguments[4]||0);let lt,xt,Ct,kt,zt,Ot,Lt,ge,Ee,Re=R.isCompressedTexture?R.mipmaps[F]:R.image;G!==null?(lt=G.max.x-G.min.x,xt=G.max.y-G.min.y,Ct=G.max.z-G.min.z,kt=G.min.x,zt=G.min.y,Ot=G.min.z):(lt=Re.width,xt=Re.height,Ct=Re.depth,kt=0,zt=0,Ot=0),W!==null?(Lt=W.x,ge=W.y,Ee=W.z):(Lt=0,ge=0,Ee=0);let ui=Yt.convert(O.format),fe=Yt.convert(O.type),Dt;if(O.isData3DTexture)I.setTexture3D(O,0),Dt=N.TEXTURE_3D;else if(O.isDataArrayTexture||O.isCompressedArrayTexture)I.setTexture2DArray(O,0),Dt=N.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,O.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,O.unpackAlignment);let Ve=N.getParameter(N.UNPACK_ROW_LENGTH),pe=N.getParameter(N.UNPACK_IMAGE_HEIGHT),Ai=N.getParameter(N.UNPACK_SKIP_PIXELS),Bn=N.getParameter(N.UNPACK_SKIP_ROWS),fi=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,Re.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Re.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,kt),N.pixelStorei(N.UNPACK_SKIP_ROWS,zt),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ot),R.isDataTexture||R.isData3DTexture?N.texSubImage3D(Dt,F,Lt,ge,Ee,lt,xt,Ct,ui,fe,Re.data):O.isCompressedArrayTexture?N.compressedTexSubImage3D(Dt,F,Lt,ge,Ee,lt,xt,Ct,ui,Re.data):N.texSubImage3D(Dt,F,Lt,ge,Ee,lt,xt,Ct,ui,fe,Re),N.pixelStorei(N.UNPACK_ROW_LENGTH,Ve),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,pe),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Ai),N.pixelStorei(N.UNPACK_SKIP_ROWS,Bn),N.pixelStorei(N.UNPACK_SKIP_IMAGES,fi),F===0&&O.generateMipmaps&&N.generateMipmap(Dt),Ht.unbindTexture()},this.initRenderTarget=function(R){qt.get(R).__webglFramebuffer===void 0&&I.setupRenderTarget(R)},this.initTexture=function(R){R.isCubeTexture?I.setTextureCube(R,0):R.isData3DTexture?I.setTexture3D(R,0):R.isDataArrayTexture||R.isCompressedArrayTexture?I.setTexture2DArray(R,0):I.setTexture2D(R,0),Ht.unbindTexture()},this.resetState=function(){_=0,A=0,T=null,Ht.reset(),we.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ki}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=t===ac?"display-p3":"srgb",e.unpackColorSpace=me.workingColorSpace===ma?"display-p3":"srgb"}},sa=class a{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new mt(t),this.density=e}clone(){return new a(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var ra=class extends Ne{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Be,this.environmentIntensity=1,this.environmentRotation=new Be,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var yn=class extends yi{constructor(t=null,e=1,i=1,n,s,r,o,l,c=oi,h=oi,d,u){super(null,r,o,l,c,h,n,s,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Us=class extends de{constructor(t,e,i,n=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},es=new Qt,Ch=new Qt,Pr=[],kh=new Mi,wg=new Qt,Rs=new At,Cs=new mn,Fi=class extends At{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Us(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<i;n++)this.setMatrixAt(n,wg)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Mi),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,es),kh.copy(t.boundingBox).applyMatrix4(es),this.boundingBox.union(kh)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new mn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,es),Cs.copy(t.boundingSphere).applyMatrix4(es),this.boundingSphere.union(Cs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let i=e.morphTargetInfluences,n=this.morphTexture.source.data.data,s=i.length+1,r=t*s+1;for(let o=0;o<i.length;o++)i[o]=n[r+o]}raycast(t,e){let i=this.matrixWorld,n=this.count;if(Rs.geometry=this.geometry,Rs.material=this.material,Rs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Cs.copy(this.boundingSphere),Cs.applyMatrix4(i),t.ray.intersectsSphere(Cs)!==!1))for(let s=0;s<n;s++){this.getMatrixAt(s,es),Ch.multiplyMatrices(i,es),Rs.matrixWorld=Ch,Rs.raycast(t,Pr);for(let r=0,o=Pr.length;r<o;r++){let l=Pr[r];l.instanceId=s,l.object=this,e.push(l)}Pr.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Us(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){let i=e.morphTargetInfluences,n=i.length+1;this.morphTexture===null&&(this.morphTexture=new yn(new Float32Array(n*this.count),n,this.count,ic,Ui));let s=this.morphTexture.source.data.data,r=0;for(let c=0;c<i.length;c++)r+=i[c];let o=this.geometry.morphTargetsRelative?1:1-r,l=n*t;s[l]=o,s.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Os=class extends gn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new mt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Ph=new Qt,Dl=new Ds,Ir=new mn,Lr=new P,aa=class extends Ne{constructor(t=new ke,e=new Os){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let i=this.geometry,n=this.matrixWorld,s=t.params.Points.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ir.copy(i.boundingSphere),Ir.applyMatrix4(n),Ir.radius+=s,t.ray.intersectsSphere(Ir)===!1)return;Ph.copy(n).invert(),Dl.copy(t.ray).applyMatrix4(Ph);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,d=i.attributes.position;if(c!==null){let u=Math.max(0,r.start),f=Math.min(c.count,r.start+r.count);for(let g=u,y=f;g<y;g++){let p=c.getX(g);Lr.fromBufferAttribute(d,p),Ih(Lr,p,l,n,t,e,this)}}else{let u=Math.max(0,r.start),f=Math.min(d.count,r.start+r.count);for(let g=u,y=f;g<y;g++)Lr.fromBufferAttribute(d,g),Ih(Lr,g,l,n,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let n=e[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=n.length;s<r;s++){let o=n[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}};function Ih(a,t,e,i,n,s,r){let o=Dl.distanceSqToPoint(a);if(o<e){let l=new P;Dl.closestPointToPoint(a,l),l.applyMatrix4(i);let c=n.ray.origin.distanceTo(l);if(c<n.near||c>n.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}var oa=class a extends ke{constructor(t=1,e=32,i=0,n=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:i,thetaLength:n},e=Math.max(3,e);let s=[],r=[],o=[],l=[],c=new P,h=new Xt;r.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let d=0,u=3;d<=e;d++,u+=3){let f=i+d/e*n;c.x=t*Math.cos(f),c.y=t*Math.sin(f),r.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(r[u]/t+1)/2,h.y=(r[u+1]/t+1)/2,l.push(h.x,h.y)}for(let d=1;d<=e;d++)s.push(d,d+1,0);this.setIndex(s),this.setAttribute("position",new be(r,3)),this.setAttribute("normal",new be(o,3)),this.setAttribute("uv",new be(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new a(t.radius,t.segments,t.thetaStart,t.thetaLength)}},ii=class a extends ke{constructor(t=1,e=1,i=1,n=32,s=1,r=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:l};let c=this;n=Math.floor(n),s=Math.floor(s);let h=[],d=[],u=[],f=[],g=0,y=[],p=i/2,m=0;x(),r===!1&&(t>0&&v(!0),e>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new be(d,3)),this.setAttribute("normal",new be(u,3)),this.setAttribute("uv",new be(f,2));function x(){let b=new P,_=new P,A=0,T=(e-t)/i;for(let k=0;k<=s;k++){let D=[],w=k/s,M=w*(e-t)+t;for(let L=0;L<=n;L++){let U=L/n,H=U*l+o,Y=Math.sin(H),B=Math.cos(H);_.x=M*Y,_.y=-w*i+p,_.z=M*B,d.push(_.x,_.y,_.z),b.set(Y,T,B).normalize(),u.push(b.x,b.y,b.z),f.push(U,1-w),D.push(g++)}y.push(D)}for(let k=0;k<n;k++)for(let D=0;D<s;D++){let w=y[D][k],M=y[D+1][k],L=y[D+1][k+1],U=y[D][k+1];t>0&&(h.push(w,M,U),A+=3),e>0&&(h.push(M,L,U),A+=3)}c.addGroup(m,A,0),m+=A}function v(b){let _=g,A=new Xt,T=new P,k=0,D=b===!0?t:e,w=b===!0?1:-1;for(let L=1;L<=n;L++)d.push(0,p*w,0),u.push(0,w,0),f.push(.5,.5),g++;let M=g;for(let L=0;L<=n;L++){let H=L/n*l+o,Y=Math.cos(H),B=Math.sin(H);T.x=D*B,T.y=p*w,T.z=D*Y,d.push(T.x,T.y,T.z),u.push(0,w,0),A.x=Y*.5+.5,A.y=B*.5*w+.5,f.push(A.x,A.y),g++}for(let L=0;L<n;L++){let U=_+L,H=M+L;b===!0?h.push(H,H+1,U):h.push(H+1,H,U),k+=3}c.addGroup(m,k,b===!0?1:2),m+=k}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new a(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};var Nl=class a extends ke{constructor(t=[],e=[],i=1,n=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:i,detail:n};let s=[],r=[];o(n),c(i),h(),this.setAttribute("position",new be(s,3)),this.setAttribute("normal",new be(s.slice(),3)),this.setAttribute("uv",new be(r,2)),n===0?this.computeVertexNormals():this.normalizeNormals();function o(x){let v=new P,b=new P,_=new P;for(let A=0;A<e.length;A+=3)f(e[A+0],v),f(e[A+1],b),f(e[A+2],_),l(v,b,_,x)}function l(x,v,b,_){let A=_+1,T=[];for(let k=0;k<=A;k++){T[k]=[];let D=x.clone().lerp(b,k/A),w=v.clone().lerp(b,k/A),M=A-k;for(let L=0;L<=M;L++)L===0&&k===A?T[k][L]=D:T[k][L]=D.clone().lerp(w,L/M)}for(let k=0;k<A;k++)for(let D=0;D<2*(A-k)-1;D++){let w=Math.floor(D/2);D%2===0?(u(T[k][w+1]),u(T[k+1][w]),u(T[k][w])):(u(T[k][w+1]),u(T[k+1][w+1]),u(T[k+1][w]))}}function c(x){let v=new P;for(let b=0;b<s.length;b+=3)v.x=s[b+0],v.y=s[b+1],v.z=s[b+2],v.normalize().multiplyScalar(x),s[b+0]=v.x,s[b+1]=v.y,s[b+2]=v.z}function h(){let x=new P;for(let v=0;v<s.length;v+=3){x.x=s[v+0],x.y=s[v+1],x.z=s[v+2];let b=p(x)/2/Math.PI+.5,_=m(x)/Math.PI+.5;r.push(b,1-_)}g(),d()}function d(){for(let x=0;x<r.length;x+=6){let v=r[x+0],b=r[x+2],_=r[x+4],A=Math.max(v,b,_),T=Math.min(v,b,_);A>.9&&T<.1&&(v<.2&&(r[x+0]+=1),b<.2&&(r[x+2]+=1),_<.2&&(r[x+4]+=1))}}function u(x){s.push(x.x,x.y,x.z)}function f(x,v){let b=x*3;v.x=t[b+0],v.y=t[b+1],v.z=t[b+2]}function g(){let x=new P,v=new P,b=new P,_=new P,A=new Xt,T=new Xt,k=new Xt;for(let D=0,w=0;D<s.length;D+=9,w+=6){x.set(s[D+0],s[D+1],s[D+2]),v.set(s[D+3],s[D+4],s[D+5]),b.set(s[D+6],s[D+7],s[D+8]),A.set(r[w+0],r[w+1]),T.set(r[w+2],r[w+3]),k.set(r[w+4],r[w+5]),_.copy(x).add(v).add(b).divideScalar(3);let M=p(_);y(A,w+0,x,M),y(T,w+2,v,M),y(k,w+4,b,M)}}function y(x,v,b,_){_<0&&x.x===1&&(r[v]=x.x-1),b.x===0&&b.z===0&&(r[v]=_/2/Math.PI+.5)}function p(x){return Math.atan2(x.z,-x.x)}function m(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new a(t.vertices,t.indices,t.radius,t.details)}};var la=class a extends Nl{constructor(t=1,e=0){let i=(1+Math.sqrt(5))/2,n=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(n,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new a(t.radius,t.detail)}};var fs=class a extends ke{constructor(t=.5,e=1,i=32,n=1,s=0,r=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:i,phiSegments:n,thetaStart:s,thetaLength:r},i=Math.max(3,i),n=Math.max(1,n);let o=[],l=[],c=[],h=[],d=t,u=(e-t)/n,f=new P,g=new Xt;for(let y=0;y<=n;y++){for(let p=0;p<=i;p++){let m=s+p/i*r;f.x=d*Math.cos(m),f.y=d*Math.sin(m),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/e+1)/2,g.y=(f.y/e+1)/2,h.push(g.x,g.y)}d+=u}for(let y=0;y<n;y++){let p=y*(i+1);for(let m=0;m<i;m++){let x=m+p,v=x,b=x+i+1,_=x+i+2,A=x+1;o.push(v,b,A),o.push(b,_,A)}}this.setIndex(o),this.setAttribute("position",new be(l,3)),this.setAttribute("normal",new be(c,3)),this.setAttribute("uv",new be(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new a(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}};var Ei=class a extends ke{constructor(t=1,e=32,i=16,n=0,s=Math.PI*2,r=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:n,phiLength:s,thetaStart:r,thetaLength:o},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));let l=Math.min(r+o,Math.PI),c=0,h=[],d=new P,u=new P,f=[],g=[],y=[],p=[];for(let m=0;m<=i;m++){let x=[],v=m/i,b=0;m===0&&r===0?b=.5/e:m===i&&l===Math.PI&&(b=-.5/e);for(let _=0;_<=e;_++){let A=_/e;d.x=-t*Math.cos(n+A*s)*Math.sin(r+v*o),d.y=t*Math.cos(r+v*o),d.z=t*Math.sin(n+A*s)*Math.sin(r+v*o),g.push(d.x,d.y,d.z),u.copy(d).normalize(),y.push(u.x,u.y,u.z),p.push(A+b,1-v),x.push(c++)}h.push(x)}for(let m=0;m<i;m++)for(let x=0;x<e;x++){let v=h[m][x+1],b=h[m][x],_=h[m+1][x],A=h[m+1][x+1];(m!==0||r>0)&&f.push(v,b,A),(m!==i-1||l<Math.PI)&&f.push(b,_,A)}this.setIndex(f),this.setAttribute("position",new be(g,3)),this.setAttribute("normal",new be(y,3)),this.setAttribute("uv",new be(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new a(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var Li=class extends gn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new mt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new mt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Zh,this.normalScale=new Xt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Be,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};function Dr(a,t,e){return!a||!e&&a.constructor===t?a:typeof t.BYTES_PER_ELEMENT=="number"?new t(a):Array.prototype.slice.call(a)}function _g(a){return ArrayBuffer.isView(a)&&!(a instanceof DataView)}var ps=class{constructor(t,e,i,n){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=n!==void 0?n:new e.constructor(i),this.sampleValues=e,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,i=this._cachedIndex,n=e[i],s=e[i-1];i:{t:{let r;e:{n:if(!(t<n)){for(let o=i+2;;){if(n===void 0){if(t<s)break n;return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=n,n=e[++i],t<n)break t}r=e.length;break e}if(!(t>=s)){let o=e[1];t<o&&(i=2,s=o);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(n=s,s=e[--i-1],t>=s)break t}r=i,i=0;break e}break i}for(;i<r;){let o=i+r>>>1;t<e[o]?r=o:i=o+1}if(n=e[i],s=e[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===void 0)return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,n)}return this.interpolate_(i,s,t,n)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,i=this.sampleValues,n=this.valueSize,s=t*n;for(let r=0;r!==n;++r)e[r]=i[s+r];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},zl=class extends ps{constructor(t,e,i,n){super(t,e,i,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Uc,endingEnd:Uc}}intervalChanged_(t,e,i){let n=this.parameterPositions,s=t-2,r=t+1,o=n[s],l=n[r];if(o===void 0)switch(this.getSettings_().endingStart){case Oc:s=t,o=2*e-i;break;case Fc:s=n.length-2,o=e+n[s]-n[s+1];break;default:s=t,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Oc:r=t,l=2*i-e;break;case Fc:r=1,l=i+n[1]-n[0];break;default:r=t-1,l=e}let c=(i-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-i),this._offsetPrev=s*h,this._offsetNext=r*h}interpolate_(t,e,i,n){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,g=(i-e)/(n-e),y=g*g,p=y*g,m=-u*p+2*u*y-u*g,x=(1+u)*p+(-1.5-2*u)*y+(-.5+u)*g+1,v=(-1-f)*p+(1.5+f)*y+.5*g,b=f*p-f*y;for(let _=0;_!==o;++_)s[_]=m*r[h+_]+x*r[c+_]+v*r[l+_]+b*r[d+_];return s}},Ul=class extends ps{constructor(t,e,i,n){super(t,e,i,n)}interpolate_(t,e,i,n){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(i-e)/(n-e),d=1-h;for(let u=0;u!==o;++u)s[u]=r[c+u]*d+r[l+u]*h;return s}},Ol=class extends ps{constructor(t,e,i,n){super(t,e,i,n)}interpolate_(t){return this.copySampleValue_(t-1)}},Di=class{constructor(t,e,i,n){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Dr(e,this.TimeBufferType),this.values=Dr(i,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,i;if(e.toJSON!==this.toJSON)i=e.toJSON(t);else{i={name:t.name,times:Dr(t.times,Array),values:Dr(t.values,Array)};let n=t.getInterpolation();n!==t.DefaultInterpolation&&(i.interpolation=n)}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new Ol(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Ul(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new zl(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case Hr:e=this.InterpolantFactoryMethodDiscrete;break;case yl:e=this.InterpolantFactoryMethodLinear;break;case to:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Hr;case this.InterpolantFactoryMethodLinear:return yl;case this.InterpolantFactoryMethodSmooth:return to}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let i=0,n=e.length;i!==n;++i)e[i]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let i=0,n=e.length;i!==n;++i)e[i]*=t}return this}trim(t,e){let i=this.times,n=i.length,s=0,r=n-1;for(;s!==n&&i[s]<t;)++s;for(;r!==-1&&i[r]>e;)--r;if(++r,s!==0||r!==n){s>=r&&(r=Math.max(r,1),s=r-1);let o=this.getValueSize();this.times=i.slice(s,r),this.values=this.values.slice(s*o,r*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,n=this.values,s=i.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let o=0;o!==s;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(r!==null&&r>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,r),t=!1;break}r=l}if(n!==void 0&&_g(n))for(let o=0,l=n.length;o!==l;++o){let c=n[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),i=this.getValueSize(),n=this.getInterpolation()===to,s=t.length-1,r=1;for(let o=1;o<s;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(n)l=!0;else{let d=o*i,u=d-i,f=d+i;for(let g=0;g!==i;++g){let y=e[d+g];if(y!==e[u+g]||y!==e[f+g]){l=!0;break}}}if(l){if(o!==r){t[r]=t[o];let d=o*i,u=r*i;for(let f=0;f!==i;++f)e[u+f]=e[d+f]}++r}}if(s>0){t[r]=t[s];for(let o=s*i,l=r*i,c=0;c!==i;++c)e[l+c]=e[o+c];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=e.slice(0,r*i)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),i=this.constructor,n=new i(this.name,t,e);return n.createInterpolant=this.createInterpolant,n}};Di.prototype.TimeBufferType=Float32Array;Di.prototype.ValueBufferType=Float32Array;Di.prototype.DefaultInterpolation=yl;var Ln=class extends Di{constructor(t,e,i){super(t,e,i)}};Ln.prototype.ValueTypeName="bool";Ln.prototype.ValueBufferType=Array;Ln.prototype.DefaultInterpolation=Hr;Ln.prototype.InterpolantFactoryMethodLinear=void 0;Ln.prototype.InterpolantFactoryMethodSmooth=void 0;var Fl=class extends Di{};Fl.prototype.ValueTypeName="color";var Bl=class extends Di{};Bl.prototype.ValueTypeName="number";var Hl=class extends ps{constructor(t,e,i,n){super(t,e,i,n)}interpolate_(t,e,i,n){let s=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=(i-e)/(n-e),c=t*o;for(let h=c+o;c!==h;c+=4)ei.slerpFlat(s,0,r,c-o,r,c,l);return s}},ca=class extends Di{InterpolantFactoryMethodLinear(t){return new Hl(this.times,this.values,this.getValueSize(),t)}};ca.prototype.ValueTypeName="quaternion";ca.prototype.InterpolantFactoryMethodSmooth=void 0;var Dn=class extends Di{constructor(t,e,i){super(t,e,i)}};Dn.prototype.ValueTypeName="string";Dn.prototype.ValueBufferType=Array;Dn.prototype.DefaultInterpolation=Hr;Dn.prototype.InterpolantFactoryMethodLinear=void 0;Dn.prototype.InterpolantFactoryMethodSmooth=void 0;var Vl=class extends Di{};Vl.prototype.ValueTypeName="vector";var Gl=class{constructor(t,e,i){let n=this,s=!1,r=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=i,this.itemStart=function(h){o++,s===!1&&n.onStart!==void 0&&n.onStart(h,r,o),s=!0},this.itemEnd=function(h){r++,n.onProgress!==void 0&&n.onProgress(h,r,o),r===o&&(s=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(h){n.onError!==void 0&&n.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){let f=c[d],g=c[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null}}},Mg=new Gl,Wl=class{constructor(t){this.manager=t!==void 0?t:Mg,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let i=this;return new Promise(function(n,s){i.load(t,n,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};Wl.DEFAULT_MATERIAL_NAME="__DEFAULT";var ms=class extends Ne{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new mt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}},ha=class extends ms{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ne.DEFAULT_UP),this.updateMatrix(),this.groundColor=new mt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}},Po=new Qt,Lh=new P,Dh=new P,Fs=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Xt(512,512),this.map=null,this.mapPass=null,this.matrix=new Qt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new zs,this._frameExtents=new Xt(1,1),this._viewportCount=1,this._viewports=[new ve(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,i=this.matrix;Lh.setFromMatrixPosition(t.matrixWorld),e.position.copy(Lh),Dh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Dh),e.updateMatrixWorld(),Po.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Po),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Po)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},ql=class extends Fs{constructor(){super(new Ge(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(t){let e=this.camera,i=Xr*2*t.angle*this.focus,n=this.mapSize.width/this.mapSize.height,s=t.distance||e.far;(i!==e.fov||n!==e.aspect||s!==e.far)&&(e.fov=i,e.aspect=n,e.far=s,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}},da=class extends ms{constructor(t,e,i=0,n=Math.PI/3,s=0,r=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Ne.DEFAULT_UP),this.updateMatrix(),this.target=new Ne,this.distance=i,this.angle=n,this.penumbra=s,this.decay=r,this.map=null,this.shadow=new ql}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}},Nh=new Qt,ks=new P,Io=new P,Xl=class extends Fs{constructor(){super(new Ge(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Xt(4,2),this._viewportCount=6,this._viewports=[new ve(2,1,1,1),new ve(0,1,1,1),new ve(3,1,1,1),new ve(1,1,1,1),new ve(3,0,1,1),new ve(1,0,1,1)],this._cubeDirections=[new P(1,0,0),new P(-1,0,0),new P(0,0,1),new P(0,0,-1),new P(0,1,0),new P(0,-1,0)],this._cubeUps=[new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,0,1),new P(0,0,-1)]}updateMatrices(t,e=0){let i=this.camera,n=this.matrix,s=t.distance||i.far;s!==i.far&&(i.far=s,i.updateProjectionMatrix()),ks.setFromMatrixPosition(t.matrixWorld),i.position.copy(ks),Io.copy(i.position),Io.add(this._cubeDirections[e]),i.up.copy(this._cubeUps[e]),i.lookAt(Io),i.updateMatrixWorld(),n.makeTranslation(-ks.x,-ks.y,-ks.z),Nh.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Nh)}},Ke=class extends ms{constructor(t,e,i=0,n=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=n,this.shadow=new Xl}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}},$l=class extends Fs{constructor(){super(new ta(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ua=class extends ms{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ne.DEFAULT_UP),this.updateMatrix(),this.target=new Ne,this.shadow=new $l}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}};var lc="\\[\\]\\.:\\/",Sg=new RegExp("["+lc+"]","g"),cc="[^"+lc+"]",Eg="[^"+lc.replace("\\.","")+"]",Tg=/((?:WC+[\/:])*)/.source.replace("WC",cc),Ag=/(WCOD+)?/.source.replace("WCOD",Eg),Rg=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",cc),Cg=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",cc),kg=new RegExp("^"+Tg+Ag+Rg+Cg+"$"),Pg=["material","materials","bones","map"],Yl=class{constructor(t,e,i){let n=i||Ae.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,n)}getValue(t,e){this.bind();let i=this._targetGroup.nCachedObjects_,n=this._bindings[i];n!==void 0&&n.getValue(t,e)}setValue(t,e){let i=this._bindings;for(let n=this._targetGroup.nCachedObjects_,s=i.length;n!==s;++n)i[n].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].unbind()}},Ae=class a{constructor(t,e,i){this.path=e,this.parsedPath=i||a.parseTrackName(e),this.node=a.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,i){return t&&t.isAnimationObjectGroup?new a.Composite(t,e,i):new a(t,e,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Sg,"")}static parseTrackName(t){let e=kg.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},n=i.nodeName&&i.nodeName.lastIndexOf(".");if(n!==void 0&&n!==-1){let s=i.nodeName.substring(n+1);Pg.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,n),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(e);if(i!==void 0)return i}if(t.children){let i=function(s){for(let r=0;r<s.length;r++){let o=s[r];if(o.name===e||o.uuid===e)return o;let l=i(o.children);if(l)return l}return null},n=i(t.children);if(n)return n}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)t[e++]=i[n]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,i=e.objectName,n=e.propertyName,s=e.propertyIndex;if(t||(t=a.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=e.objectIndex;switch(i){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let r=t[n];if(r===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+n+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(n==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[s]!==void 0&&(s=t.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=s}else r.fromArray!==void 0&&r.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(l=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=n;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ae.Composite=Yl;Ae.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ae.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ae.prototype.GetterByBindingType=[Ae.prototype._getValue_direct,Ae.prototype._getValue_array,Ae.prototype._getValue_arrayElement,Ae.prototype._getValue_toArray];Ae.prototype.SetterByBindingTypeAndVersioning=[[Ae.prototype._setValue_direct,Ae.prototype._setValue_direct_setNeedsUpdate,Ae.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_array,Ae.prototype._setValue_array_setNeedsUpdate,Ae.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_arrayElement,Ae.prototype._setValue_arrayElement_setNeedsUpdate,Ae.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_fromArray,Ae.prototype._setValue_fromArray_setNeedsUpdate,Ae.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var f1=new Float32Array(1);var zh=new Qt,fa=class{constructor(t,e,i=0,n=1/0){this.ray=new Ds(t,e),this.near=i,this.far=n,this.camera=null,this.layers=new Ns,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return zh.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(zh),this}intersectObject(t,e=!0,i=[]){return jl(t,this,i,e),i.sort(Uh),i}intersectObjects(t,e=!0,i=[]){for(let n=0,s=t.length;n<s;n++)jl(t[n],this,i,e);return i.sort(Uh),i}};function Uh(a,t){return a.distance-t.distance}function jl(a,t,e,i){let n=!0;if(a.layers.test(t.layers)&&a.raycast(t,e)===!1&&(n=!1),n===!0&&i===!0){let s=a.children;for(let r=0,o=s.length;r<o;r++)jl(s[r],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Zl}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Zl);var hc=Math.PI*2,Z=(a,t,e)=>a<t?t:a>e?e:a,xi=a=>Z(a,0,1),Rt=(a,t,e)=>a+(t-a)*e;var Ft=a=>(a=xi(a),a*a*(3-2*a)),ad=a=>(a=xi(a),a*a*a*(a*(a*6-15)+10));var He=(a,t,e,i)=>Rt(a,t,1-Math.exp(-e*i)),Nn=(a,t,e,i)=>{let n=((t-a+Math.PI)%hc+hc)%hc-Math.PI;return a+n*(1-Math.exp(-e*i))};var ya=(a,t,e,i)=>Math.hypot(a-e,t-i);var Pt=class a{constructor(t=1337){this.s=t>>>0||1}next(){let t=this.s+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}range(t,e){return t+this.next()*(e-t)}int(t,e){return Math.floor(this.range(t,e+1))}chance(t){return this.next()<t}pick(t){return t[Math.floor(this.next()*t.length)]}pickWeighted(t,e){let i=0;for(let s of t)i+=e(s);let n=this.next()*i;for(let s of t)if(n-=e(s),n<=0)return s;return t[t.length-1]}shuffle(t){for(let e=t.length-1;e>0;e--){let i=Math.floor(this.next()*(e+1)),n=t[e];t[e]=t[i],t[i]=n}return t}bell(){return(this.next()+this.next()+this.next())/3}fork(t=0){return new a((this.s^t*2654435761)>>>0||7)}},od=(a,t,e=0)=>{let i=Math.imul(a|0,374761393)^Math.imul(t|0,668265263)^Math.imul(e|0,2246822519);return i=Math.imul(i^i>>>13,1274126177),((i^i>>>16)>>>0)/4294967296},gt=class{constructor(t=1){let e=new Pt(t);this.perm=new Uint8Array(512);let i=Array.from({length:256},(n,s)=>s);e.shuffle(i);for(let n=0;n<512;n++)this.perm[n]=i[n&255]}value2(t,e,i=256){let n=Math.floor(t),s=Math.floor(e),r=t-n,o=e-s,l=ad(r),c=ad(o),h=b=>(b%i+i)%i,d=(b,_)=>this.perm[this.perm[h(b)&255]+h(_)&511]/255,u=h(n),f=h(n+1),g=h(s),y=h(s+1),p=d(u,g),m=d(f,g),x=d(u,y),v=d(f,y);return Rt(Rt(p,m,l),Rt(x,v,l),c)}fbm2(t,e,i=4,n=256,s=.5,r=2){let o=0,l=1,c=0,h=1;for(let d=0;d<i;d++)o+=l*this.value2(t*h,e*h,n*h),c+=l,l*=s,h*=r;return o/c}ridged(t,e,i=4,n=256){let s=0,r=.5,o=1,l=0;for(let c=0;c<i;c++){let h=1-Math.abs(this.value2(t*o,e*o,n*o)*2-1);s+=h*h*r,l+=r,r*=.5,o*=2}return s/l}cells(t,e,i=8,n=1){let s=Math.floor(t),r=Math.floor(e),o=9;for(let l=-1;l<=1;l++)for(let c=-1;c<=1;c++){let h=s+c,d=r+l,u=od(h,d,i*977+n),f=od(h,d,i*613+91*n),g=h+u,y=d+f,p=(g-t)*(g-t)+(y-e)*(y-e);p<o&&(o=p)}return Math.sqrt(o)}};var dc=a=>Math.round(xi(a)*255),te=class{constructor(t,e){this.w=t,this.h=e,this.C=new Float32Array(t*e*3),this.H=new Float32Array(t*e),this.R=new Float32Array(t*e),this.M=new Float32Array(t*e),this.E=new Float32Array(t*e*3)}idx(t,e){let i=this.w,n=this.h;return t=(t%i+i)%i,e=(e%n+n)%n,e*i+t}col(t,e){let i=this.idx(t,e)*3;return[this.C[i],this.C[i+1],this.C[i+2]]}setC(t,e,i,n,s){let r=this.idx(t,e)*3;this.C[r]=i,this.C[r+1]=n,this.C[r+2]=s}addC(t,e,i,n,s,r=1){let o=this.idx(t,e)*3;this.C[o]+=i*r,this.C[o+1]+=n*r,this.C[o+2]+=s*r}mulC(t,e,i){let n=this.idx(t,e)*3;this.C[n]*=i,this.C[n+1]*=i,this.C[n+2]*=i}setAll(t){let{w:e,h:i}=this;for(let n=0;n<i;n++)for(let s=0;s<e;s++)t(this,s,n,s/e,n/i)}},xa=a=>(t,e,i,n=4,s=.5)=>a.fbm2(t*i,e*i,n,i,s);function Ig(a,t=2){let{w:e,h:i}=a,n=new Uint8ClampedArray(e*i*4),s=a.H;for(let r=0;r<i;r++){let o=(r-1+i)%i*e,l=(r+1)%i*e;for(let c=0;c<e;c++){let h=(c-1+e)%e,d=(c+1)%e,u=s[o+h],f=s[o+d],g=s[l+h],y=s[l+d],p=s[o+d]+2*s[r*e+d]+y-(u+2*s[r*e+h]+g),m=y+2*s[l+c]+f-(u+2*s[o+c]+g),x=-p*t,v=-m*t,b=1,_=Math.hypot(x,v,b)||1;x/=_,v/=_,b/=_;let A=(r*e+c)*4;n[A]=(x*.5+.5)*255,n[A+1]=(v*.5+.5)*255,n[A+2]=(b*.5+.5)*255,n[A+3]=255}}return n}function Lg(a,t,e,i=6){let n=new Float32Array(t*e),s=new Float32Array(t*e),r=1/(i*2+1);for(let o=0;o<e;o++){let l=0;for(let c=-i;c<=i;c++)l+=a[o*t+(c+t*2)%t];for(let c=0;c<t;c++)n[o*t+c]=l*r,l+=a[o*t+(c+i+1)%t]-a[o*t+(c-i+t)%t]}for(let o=0;o<t;o++){let l=0;for(let c=-i;c<=i;c++)l+=n[(c+e*2)%e*t+o];for(let c=0;c<e;c++)s[c*t+o]=l*r,l+=n[(c+i+1)%e*t+o]-n[(c-i+e)%e*t+o]}return s}function re(a,t={}){let{w:e,h:i}=a,n=new Uint8ClampedArray(e*i*4),s=new Uint8ClampedArray(e*i*4),r=new Uint8ClampedArray(e*i*4),o=Lg(a.H,e,i,t.aoRadius||7),l=t.ao!==void 0?t.ao:.55;for(let c=0;c<e*i;c++){let h=Z(.5+(a.H[c]-o[c])*l*8,.25,1);n[c*4]=dc(a.C[c*3]),n[c*4+1]=dc(a.C[c*3+1]),n[c*4+2]=dc(a.C[c*3+2]),n[c*4+3]=255,s[c*4]=Math.round(h*255),s[c*4+1]=Math.round(xi(a.R[c])*255),s[c*4+2]=Math.round(xi(a.M[c])*255),s[c*4+3]=255,r[c*4]=Math.round(xi(a.E[c*3])*255),r[c*4+1]=Math.round(xi(a.E[c*3+1])*255),r[c*4+2]=Math.round(xi(a.E[c*3+2])*255),r[c*4+3]=255}return{width:e,height:i,albedo:n,normal:Ig(a,t.normalStrength??2.2),orm:s,emissive:a.E.some(c=>c>0)?r:null}}var bt={};bt.concrete=(a,t,e=11)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+71),r=xa(n),o=xa(s),l=new Pt(e+5),c=[];for(let d=0;d<Math.round(a*t*.0025);d++)c.push([l.int(0,a-1),l.int(0,t-1),l.range(.6,2.2),l.range(.25,.8)]);let h=[];for(let d=0;d<7;d++)h.push([l.range(0,1),l.range(0,1),l.range(.04,.22),l.range(.35,.9)]);return i.setAll((d,u,f,g,y)=>{let p=r(g,y,6,5),m=o(g,y,32,3),x=r(g*.15,y,12,3),v=.4+p*.2+m*.07,b=Math.min(Math.abs(g*2%1-0),Math.abs(g*2%1-1)),_=Math.min(Math.abs(y*2%1-0),Math.abs(y*2%1-1)),A=Math.min(b,_),T=.55+p*.06;A<.004&&(v*=.62,T-=.18);let k=n.cells(g*5,y*5,5,3),D=n.cells(g*9+.3,y*9,9,8),w=Math.min(k,D);w<.028&&(v*=.55,T-=.12*(1-w/.028));let M=0;for(let[U,H,Y,B]of h){let et=Math.hypot((g-U+1.5)%1-.5,(y-H+1.5)%1-.5);M=Math.max(M,Ft(1-et/Y)*B*.5)}v*=1-M;let L=0;for(let[U,H,Y,B]of c){let et=Math.min(Math.abs(u-U),a-Math.abs(u-U)),q=Math.min(Math.abs(f-H),t-Math.abs(f-H));et*et+q*q<Y*Y&&(L=Math.max(L,B))}T-=L*.35,v-=L*.18,d.setC(u,f,v*1,v*.99+x*.02,v*.96+.01),d.H[f*a+u]=T,d.R[f*a+u]=.86+m*.1-M*.18+L*.05,d.M[f*a+u]=0}),re(i,{normalStrength:2.6,ao:.5})};bt.concrete_floor=(a,t,e=23)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+31),r=new Pt(e+9),o=Array.from({length:5},()=>[r.range(0,1),r.range(0,1),r.range(.05,.16)]);return i.setAll((l,c,h,d,u)=>{let f=n.fbm2(d*8,u*8,4,8),g=s.fbm2(d*40,u*40,3,40),y=.34+f*.16+g*.06,p=Math.min(d*2%1,1-d*2%1),m=Math.min(u*2%1,1-u*2%1),x=Math.min(p,m),v=.6+f*.04;x<.006&&(y*=.5,v-=.25);let b=0;for(let[_,A,T]of o){let k=Math.hypot((d-_+1.5)%1-.5,(u-A+1.5)%1-.5);b=Math.max(b,Ft(1-k/T)*.75)}y*=1-b*.55,l.setC(c,h,y,y*.985,y*.95),l.H[h*a+c]=v,l.R[h*a+c]=.72-b*.45+g*.06,l.M[h*a+c]=0}),re(i,{normalStrength:2.2})};bt.brick=(a,t,e=41)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+13),r=8,o=16,l=a/r,c=t/o,h=new Pt(e+3),d=[];for(let u=0;u<o;u++)for(let f=0;f<r;f++)d.push({r:u,c:f,tone:h.range(-.09,.09),hue:h.range(-.03,.03),chip:h.next()<.22?h.range(.3,1):0,soot:h.range(0,1)});return i.setAll((u,f,g,y,p)=>{let m=p*o,x=(y*r+Math.floor(m)%2*.5)%r,v=Math.floor(x),b=Math.floor(m),_=d[b%o*r+v%r],A=x%1*l,T=m%1*c,k=Math.min(A,l-A,T,c-T),D=n.fbm2(y*24,p*24,4,24),w=s.fbm2(y*90,p*90,2,90),M=.7+D*.08,L;if(k<1.6){L=.42+D*.12,M=.32+D*.04,u.setC(f,g,L,L*.97,L*.9),u.H[g*a+f]=M,u.R[g*a+f]=.95,u.M[g*a+f]=0;return}L=.31+_.tone+D*.09;let U=L*1.25+_.hue,H=L*.62,Y=L*.5;if(_.chip>0){let et=Math.min(Math.hypot(A,T),Math.hypot(l-A,T),Math.hypot(A,c-T),Math.hypot(l-A,c-T)),q=2.4*_.chip;et<q&&(L=.5+D*.1,M-=.16)}let B=_.soot*.12+s.fbm2(y*5,p*5,3,5)*.12;u.setC(f,g,U*(1-B)+w*.03,H*(1-B)+w*.02,Y*(1-B)+w*.02),u.H[g*a+f]=M+w*.03,u.R[g*a+f]=.93-B*.2,u.M[g*a+f]=0}),re(i,{normalStrength:3.4})};bt.brick_grey=(a,t,e=47)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+3),r=6,o=10,l=new Pt(e),c=Array.from({length:r*o},()=>l.range(-.05,.05));return i.setAll((h,d,u,f,g)=>{let y=g*o,p=(f*r+Math.floor(y)%2*.5)%r,m=p%1*(a/r),x=y%1*(t/o),v=Math.min(m,a/r-m,x,t/o-x),b=n.fbm2(f*16,g*16,4,16),_=s.fbm2(f*64,g*64,3,64),A=c[Math.floor(y)%o*r+Math.floor(p)%r];if(v<1.3){let k=.36+b*.08;h.setC(d,u,k,k,k*.98),h.H[u*a+d]=.3,h.R[u*a+d]=.95;return}let T=.45+b*.14+_*.05+A;v<3&&(T*=.9),h.setC(d,u,T,T*.99,T*.95),h.H[u*a+d]=.65+b*.1-(v<3?.06:0),h.R[u*a+d]=.9}),re(i,{normalStrength:3})};bt.asphalt=(a,t,e=61)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+9),r=xa(n),o=xa(s);return i.setAll((l,c,h,d,u)=>{let f=.115+r(d,u,10,4)*.075,g=s.cells(d*46,u*46,46,4),y=s.value2(d*190,u*190,190),p=f+(g<.35?.11:0)+y*.035,m=.5+(g<.35?.16:0)+y*.12,x=Math.min(n.cells(d*4.2,u*4.2,4,17),n.cells(d*7.3,u*7.3,7,29));x<.02&&(p*=.35,m-=.3*(1-x/.02));let v=o(d,u,3,3);v>.66&&(p*=.8),l.setC(c,h,p,p*.99,p*.97),l.H[h*a+c]=m,l.R[h*a+c]=.8+y*.12+(v>.66?-.22:0),l.M[h*a+c]=0}),re(i,{normalStrength:1.8})};bt.dirt=(a,t,e=71)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+5);return i.setAll((r,o,l,c,h)=>{let d=n.fbm2(c*7,h*7,5,7),u=s.fbm2(c*44,h*44,3,44),f=s.cells(c*22,h*22,22,3),g=.19+d*.11+u*.05,y=.45+d*.2+u*.12;f<.14&&(g+=.13,y+=.25),r.setC(o,l,g*1.1,g*.94,g*.74),r.H[l*a+o]=y,r.R[l*a+o]=.92-u*.08}),re(i,{normalStrength:2})};bt.grass=(a,t,e=83)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+17),r=new Pt(e+2),o=[];for(let l=0;l<Math.round(a*t*.035);l++)o.push([r.int(0,a-1),r.int(0,t-1),r.range(1.5,4),r.range(0,1),r.next()<.35]);i.setAll((l,c,h,d,u)=>{let f=n.fbm2(d*5,u*5,4,5),g=s.fbm2(d*17,u*17,3,17),y=s.value2(d*120,u*120,120),p=Ft((f-.28)*2),m=.19+g*.09+y*.05,x=Rt(m*.92,m*1.3,p),v=Rt(m*1.06,m*1,p),b=Rt(m*.66,m*.62,p);l.setC(c,h,x,v,b),l.H[h*a+c]=.45+g*.18+y*.1,l.R[h*a+c]=.93});for(let[l,c,h,d,u]of o)for(let f=0;f<h;f++){let g=c-f,y=i.idx(l+Math.floor(f*.18),g);i.C[y*3]+=.03*(1-d)+(u?.05:0),i.C[y*3+1]+=.045*(1-d*.5),i.C[y*3+2]+=.012,i.H[y]+=.1}return re(i,{normalStrength:1.3,ao:.3})};bt.gravel=(a,t,e=97)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+4);return i.setAll((r,o,l,c,h)=>{let d=n.cells(c*18,h*18,18,1),u=s.cells(c*34,h*34,34,7),f=Math.min(d,u),g=f<.36?1:0,p=.26+s.fbm2(c*30,h*30,3,30)*.12-f*.12;g&&(p+=.1),r.setC(o,l,p*1.05,p,p*.9),r.H[l*a+o]=.4+(g?.35-f*.5:.05),r.R[l*a+o]=.9}),re(i,{normalStrength:3.2})};bt.rust=(a,t,e=101)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+8);return i.setAll((r,o,l,c,h)=>{let d=n.fbm2(c*7,h*7,5,7),u=s.fbm2(c*30,h*30,3,30),f=s.cells(c*12,h*12,12,5),g=.16+d*.2+u*.06,y=Ft((d-.35)*2.2);r.setC(o,l,Rt(.13,.42,y)+u*.05,Rt(.09,.19,y)+u*.02,Rt(.07,.06,y)),r.H[l*a+o]=.45+u*.2-(f<.2?.12:0)+g*.1,r.R[l*a+o]=.88-d*.15,r.M[l*a+o]=.35+d*.2}),re(i,{normalStrength:2.6})};bt.steel=(a,t,e=113)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+6),r=2;return i.setAll((o,l,c,h,d)=>{let u=h*r%1,f=d*r%1,g=Math.min(u,1-u,f,1-f),y=n.fbm2(h*12,d*12,4,12),p=s.fbm2(h*55,d*55,2,55),m=.26+y*.08+p*.03,x=.55+y*.04,v=.55+y*.18;g<.008&&(m*=.55,x-=.15);let b=g<.045&&g>.012,_=u*10%1,A=f*10%1,T=Math.hypot(_-.5,A-.5)*.1;if(b&&T<.018){let w=1-T/.018;m+=w*.1,x+=w*.22,v-=w*.1}let k=Ft((y-.55)*3)*(1-Ft(g*6));m=Rt(m,.24,k*.5);let D=y*.6+.2;o.setC(l,c,m*(1+k*.35),m*(1-k*.05),m*(1-k*.25)),o.H[c*a+l]=x,o.R[c*a+l]=Z(v+k*.3,.15,1),o.M[c*a+l]=Rt(.85,.25,k)}),re(i,{normalStrength:3.2})};bt.metal_paint=(a,t,e=127)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+12);return i.setAll((r,o,l,c,h)=>{let d=n.fbm2(c*9,h*9,4,9),u=s.fbm2(c*60,h*60,2,60),f=s.cells(c*14,h*14,14,3),g=.2+d*.06,y=g*.85,p=g*1.02,m=g*.72,x=.6+u*.03,v=.55+d*.12,b=.25;if(f<.12||d>.72){let _=f<.06?1:.45;y=Rt(y,.3,_),p=Rt(p,.16,_),m=Rt(m,.1,_),x-=.1*_,v=Rt(v,.85,_),b=Rt(b,.55,_)}r.setC(o,l,y,p,m),r.H[l*a+o]=x,r.R[l*a+o]=v,r.M[l*a+o]=b}),re(i,{normalStrength:2})};bt.wood=(a,t,e=131)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+21),r=5,o=new Pt(e+1),l=Array.from({length:r},()=>o.range(-.05,.05)),c=Array.from({length:4},()=>[o.range(0,1),o.range(0,1),o.range(.01,.03)]);return i.setAll((h,d,u,f,g)=>{let y=Math.floor(f*r),p=f*r%1,m=n.fbm2(f*3+y*7.3,g*40,4,8),x=s.fbm2(f*90,g*240,2,90),v=.235+m*.1+x*.04+l[y%r],b=.6+m*.08+x*.05,_=.82+x*.1;(p<.02||p>.98)&&(b-=.25),Math.min(p,1-p)<.006&&(b-=.3);for(let[D,w,M]of c){let L=Math.hypot((f-D+1.5)%1-.5,(g-w+1.5)%1-.5);L<M&&(b+=.08*(1-L/M))}let T=Ft((.5-Math.abs(p-.5))*0)*0,k=s.fbm2(f*6,g*6,3,6);h.setC(d,u,v*1.15*(1-k*.25),v*.95*(1-k*.2),v*.72*(1-k*.15)),h.H[u*a+d]=b,h.R[u*a+d]=_,h.M[u*a+d]=0}),re(i,{normalStrength:3})};bt.wood_weathered=(a,t,e=137)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+2),r=6;return i.setAll((o,l,c,h,d)=>{let u=h*r%1,f=n.fbm2(h*4,d*50,4,6),g=s.fbm2(h*70,d*200,2,70),y=.3+f*.12+g*.05,p=.6+f*.1+g*.05;Math.min(u,1-u)<.012&&(p-=.3),o.setC(l,c,y*1,y*.98,y*.92),o.H[c*a+l]=p,o.R[c*a+l]=.9}),re(i,{normalStrength:2.8})};bt.tiles=(a,t,e=149)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+3),r=8,o=8,l=new Pt(e),c=Array.from({length:r*o},()=>l.range(-.04,.02));return i.setAll((h,d,u,f,g)=>{let y=Math.floor(f*r),p=Math.floor(g*o),m=f*r%1,x=g*o%1,v=Math.min(m,1-m,x,1-x)*(a/r),b=n.fbm2(f*20,g*20,3,20),_=s.fbm2(f*90,g*90,2,90),A=.66+b*.06+c[p%o*r+y%r],T=.7-b*.03,k=.28+b*.12,D=0;v<1.4&&(A=.28+b*.08,T=.3,k=.9);let w=Ft((6-v)/6)*(.4+b*.6);A*=1-w*.35,s.cells(f*3,g*3,3,9)<.012&&(A*=.4,T-=.2),h.setC(d,u,A,A*.99,A*.95),h.H[u*a+d]=T,h.R[u*a+d]=k,h.M[u*a+d]=D}),re(i,{normalStrength:2.4})};bt.panel=(a,t,e=151)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+4);return i.setAll((r,o,l,c,h)=>{let d=n.fbm2(c*8,h*8,4,8),u=s.fbm2(c*45,h*45,3,45),f=s.cells(c*7,h*7,7,2),g=.44+d*.1+u*.03,y=.55+u*.04,p=.8;if(f<.18){let x=1-f/.18;g=Rt(g,.3,x*.8),y-=x*.12,p=Rt(p,.92,x)}let m=n.fbm2(c*22,h*2,3,22);g*=1-Ft((m-.55)*4)*.35,r.setC(o,l,g*.98,g*.95,g*.86),r.H[l*a+o]=y,r.R[l*a+o]=p}),re(i,{normalStrength:2})};bt.fabric=(a,t,e=157)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+5);return i.setAll((r,o,l,c,h)=>{let d=(Math.sin(c*a*.9)*.5+.5)*(Math.cos(h*t*.9)*.5+.5),u=n.fbm2(c*10,h*10,4,10),f=s.fbm2(c*30,h*30,2,30),g=Ft((s.fbm2(c*4,h*4,3,4)-.52)*3),y=.47+d*.09+u*.07;r.setC(o,l,y*1*(1-g*.38),y*.93*(1-g*.34),y*.82*(1-g*.26)),r.H[l*a+o]=.5+d*.15+f*.05,r.R[l*a+o]=.94}),re(i,{normalStrength:1.6,ao:.3})};bt.skin=(a,t,e=161)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+3);return i.setAll((r,o,l,c,h)=>{let d=s.value2(c*130,h*130,130),u=n.fbm2(c*6,h*6,4,6),f=Ft((s.fbm2(c*2.5,h*2.5,3,2.5)-.5)*2.4),g=.7+u*.1-d*.045;r.setC(o,l,g*(1+f*.09),g*.86,g*(.78-f*.04)),r.H[l*a+o]=.5+d*.18+u*.06,r.R[l*a+o]=.72}),re(i,{normalStrength:.7,ao:.16})};bt.denim=(a,t,e=167)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+4);return i.setAll((r,o,l,c,h)=>{let d=Math.sin((c*a+h*t)*.55)*.5+.5,u=(Math.sin(c*a*2.4)*.5+.5)*.4+.6,f=Ft((s.fbm2(c*7,h*7,3,7)-.55)*2.6),g=Ft((n.fbm2(c*3,h*3,3,3)-.42)*1.8),y=.31+d*.06+g*.1+f*.11;r.setC(o,l,y*.8,y*.94,y*1.3),r.H[l*a+o]=.5+d*.2+u*.05,r.R[l*a+o]=.92}),re(i,{normalStrength:1.2,ao:.24})};bt.leather=(a,t,e=173)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+8);return i.setAll((r,o,l,c,h)=>{let d=s.value2(c*90,h*90,90),u=Math.abs(n.fbm2(c*8,h*8,4,8)-.5)*2,f=Ft((s.fbm2(c*4,h*4,3,4)-.62)*3),g=.29+d*.05+(1-u)*.05+f*.13;r.setC(o,l,g*1.06,g*.82,g*.62),r.H[l*a+o]=.5+d*.25-u*.14,r.R[l*a+o]=.55+d*.18}),re(i,{normalStrength:1.4,ao:.3})};bt.sand=(a,t,e=163)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+6);return i.setAll((r,o,l,c,h)=>{let d=Math.sin(h*40+n.value2(c*6,h*6,6)*9)*.5+.5,u=n.fbm2(c*12,h*12,4,12),f=s.value2(c*140,h*140,140),g=.36+u*.1+f*.08+d*.03;r.setC(o,l,g*1.02,g*.96,g*.86),r.H[l*a+o]=.45+d*.12+f*.12,r.R[l*a+o]=.95}),re(i,{normalStrength:2.2})};bt.rock=(a,t,e=167)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+8);return i.setAll((r,o,l,c,h)=>{let d=n.ridged(c*6,h*6,5,6),u=s.fbm2(c*10,h*10,4,10),f=s.cells(c*5,h*5,5,13),g=.2+d*.2+u*.09,y=d*.9+u*.15,p=g;f<.03&&(p*=.5,y-=.25*(1-f/.03));let m=Ft((u-.52)*4);r.setC(o,l,p*(1-m*.55),p*(1+m*.18),p*(1-m*.5)),r.H[l*a+o]=y,r.R[l*a+o]=.9-m*.15}),re(i,{normalStrength:3})};bt.bark=(a,t,e=173)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+5);return i.setAll((r,o,l,c,h)=>{let d=n.ridged(c*12,h*4,4,12),u=s.fbm2(c*30,h*8,3,30),f=.13+d*.14+u*.04,g=Ft((s.fbm2(c*5,h*5,3,5)-.55)*3);r.setC(o,l,f*1.1*(1-g*.4),f*.95*(1+g*.4),f*.78*(1-g*.2)),r.H[l*a+o]=d*.9+u*.2,r.R[l*a+o]=.92}),re(i,{normalStrength:3.4})};bt.leaves=(a,t,e=179)=>{let i=new te(a,t),n=new gt(e),s=new Pt(e),r=[];for(let h=0;h<46;h++)r.push({x:s.range(.06,.94),y:s.range(.06,.94),a:s.range(0,Math.PI*2),len:s.range(.06,.16),wd:s.range(.03,.07),tone:s.range(-.5,.5),rot:s.range(0,1)});let o=new Uint8ClampedArray(a*t);i.setAll((h,d,u,f,g)=>{h.setC(d,u,0,0,0),h.H[u*a+d]=0,h.R[u*a+d]=.8});for(let h of r){let d=h.x*a,u=h.y*t,f=h.len*a,g=h.wd*a,y=Math.cos(h.a),p=Math.sin(h.a);for(let m=0;m<Math.ceil(f*2);m++)for(let x=-Math.ceil(g);x<=Math.ceil(g);x++){let v=m/(f*2),b=Math.sin(v*Math.PI)*g;if(Math.abs(x)>b)continue;let _=Math.round(d+y*(m-f)+-p*x),A=Math.round(u+p*(m-f)+y*x);if(_<0||A<0||_>=a||A>=t)continue;let T=A*a+_,k=n.value2(_/a*30,A/t*30,30),D=h.tone>.2,w=D?.3+k*.2+h.tone*.1:.16+k*.18;i.C[T*3]=D?.3+h.tone*.2:w*.8,i.C[T*3+1]=w,i.C[T*3+2]=D?.1:w*.55,i.H[T]=.5,o[T]=255}}let l=re(i,{normalStrength:1,ao:.2}),c=l.albedo;for(let h=0;h<a*t;h++)c[h*4+3]=o[h];return l};bt.blood=(a,t,e=181)=>{let i=new te(a,t),n=new gt(e),s=new Uint8ClampedArray(a*t),r=a/2,o=t/2;i.setAll((c,h,d,u,f)=>{let g=Math.hypot(u-.5,f-.5),y=n.fbm2(u*8,f*8,4,8),p=n.fbm2(u*26,f*26,3,26),m=Ft((.34+y*.16-g)*6),x=n.value2(u*26,f*26,26);x>.78&&(m=Math.max(m,Ft((x-.78)*8)*.9)),m*=.55+p*.7;let v=.16+y*.14;c.setC(h,d,v*1.5,v*.16,v*.14),c.H[d*a+h]=.5,c.R[d*a+h]=.22+y*.2,s[d*a+h]=Z(m,0,1)*255});let l=re(i,{normalStrength:.6});for(let c=0;c<a*t;c++)l.albedo[c*4+3]=s[c];return l};bt.bullet=(a,t,e=191)=>{let i=new te(a,t),n=new gt(e),s=new Uint8ClampedArray(a*t);i.setAll((o,l,c,h,d)=>{let u=Math.hypot(h-.5,d-.5),f=n.fbm2(h*18,d*18,4,18),g=Ft((.18+f*.08-u)*10),y=Ft((.1+f*.05-u)*14),p=Rt(.34,.05,y);p+=Ft((u-.22)*12)*.1*(f>.5?1:.4),o.setC(l,c,p,p*.95,p*.9),o.H[c*a+l]=1-y*.8+g*.1,o.R[c*a+l]=.7,s[c*a+l]=Z(g,0,1)*255});let r=re(i,{normalStrength:2.2});for(let o=0;o<a*t;o++)r.albedo[o*4+3]=s[o];return r};bt.hazard=(a,t,e=193)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+3);return i.setAll((r,o,l,c,h)=>{let d=Math.floor((c+h)*12)%2,u=s.fbm2(c*30,h*30,3,30),f=s.cells(c*20,h*20,20,7),g;d?g=[.62+u*.1,.48+u*.06,.06]:g=[.1+u*.05,.1+u*.05,.09+u*.04],f<.1&&(g=[.22+u*.1,.15,.12]),r.setC(o,l,g[0],g[1],g[2]),r.H[l*a+o]=.6+u*.1-(f<.1?.2:0),r.R[l*a+o]=.7+u*.2,r.M[l*a+o]=.2}),re(i,{normalStrength:1.8})};bt.flesh=(a,t,e=197)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+4);return i.setAll((r,o,l,c,h)=>{let d=n.fbm2(c*6,h*6,5,6),u=s.fbm2(c*24,h*24,3,24),f=s.ridged(c*4,h*4,3,4),g=.3+d*.22+u*.06,y=Ft((f-.62)*6),p=Ft((n.fbm2(c*3,h*3,2,3)-.55)*4);r.setC(o,l,Rt(g*1,.36,y)*(1-p*.35),Rt(g*.86,.12,y)*(1-p*.5),Rt(g*.8,.22,y)*(1-p*.1)),r.H[l*a+o]=.5+d*.2+u*.1+y*.1,r.R[l*a+o]=.42-y*.2+u*.1,r.M[l*a+o]=0}),re(i,{normalStrength:2.6})};bt.armor=(a,t,e=211)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+9);return i.setAll((r,o,l,c,h)=>{let d=n.cells(c*6,h*6,6,2),u=Ft((.12-d)*8),f=s.fbm2(c*16,h*16,4,16),g=Ft((f-.5)*4),y=.2+f*.12-u*.06,p=Rt(y*.9,.34,g),m=Rt(y*.92,.15,g),x=Rt(y*.95,.09,g);r.setC(o,l,p,m,x),r.H[l*a+o]=.7-u*.3+f*.05,r.R[l*a+o]=.55+g*.3,r.M[l*a+o]=Rt(.6,.25,g)}),re(i,{normalStrength:3})};bt.nest=(a,t,e=223)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+1);return i.setAll((r,o,l,c,h)=>{let d=n.ridged(c*8,h*8,4,8),u=s.fbm2(c*5,h*5,4,5),f=.22+d*.18+u*.12;r.setC(o,l,f*.75,f*.5,f*.46),r.H[l*a+o]=d*.8+u*.3,r.R[l*a+o]=.45+u*.25}),re(i,{normalStrength:3.2})};bt.radiation=(a,t,e=227)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+7);return i.setAll((r,o,l,c,h)=>{let d=n.fbm2(c*7,h*7,5,7),u=s.fbm2(c*30,h*30,3,30),f=Ft((d-.42)*2.5),g=.1+d*.1;r.setC(o,l,g*.7+f*.12,g*.9+f*.55,g*.6+f*.1),r.H[l*a+o]=.5+u*.2,r.R[l*a+o]=.35+u*.4,r.E[l*a*3]=f*.25,r.E[l*a*3+1]=f*.85,r.E[l*a*3+2]=f*.2}),re(i,{normalStrength:1.6})};bt.screen=(a,t,e=229)=>{let i=new te(a,t),n=new gt(e);return i.setAll((s,r,o,l,c)=>{let h=(Math.sin(c*t*.8)*.5+.5)*.25+.6,d=n.value2(l*60,c*60,60),u=1-Math.hypot(l-.5,c-.5)*.6,f=Math.floor(c*26)%3===0?Ft((.5-Math.abs(l-.5))*2)*.5:0,g=(.06+d*.05+f*.4)*u;s.setC(r,o,g*.5,g*.9,g*.65),s.H[o*a+r]=.5,s.R[o*a+r]=.25,s.E[o*a*3]=g*.6,s.E[o*a*3+1]=g*1,s.E[o*a*3+2]=g*.8}),re(i,{normalStrength:.4})};bt.corrugated=(a,t,e=233)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+3);return i.setAll((r,o,l,c,h)=>{let d=Math.sin(c*Math.PI*2*12)*.5+.5,u=n.fbm2(c*8,h*8,4,8),f=s.fbm2(c*40,h*40,3,40),g=Ft((f-.35)*2.2),y=.2+d*.08+u*.06;r.setC(o,l,Rt(y,.38,g*.8),Rt(y*.95,.18,g*.8),Rt(y*.9,.12,g*.8)),r.H[l*a+o]=.4+d*.5,r.R[l*a+o]=.6+g*.3,r.M[l*a+o]=.7-g*.5}),re(i,{normalStrength:3.6})};bt.paper=(a,t,e=239)=>{let i=new te(a,t),n=new gt(e),s=new gt(e+2);return i.setAll((r,o,l,c,h)=>{let d=n.fbm2(c*10,h*10,4,10),u=Ft((s.fbm2(c*3.5,h*3.5,3,4)-.5)*3),f=.72+d*.07;r.setC(o,l,f,f*.94*(1-u*.25),f*.8),r.H[l*a+o]=.5+d*.15,r.R[l*a+o]=.9}),re(i,{normalStrength:1,ao:.2})};bt.grasscard=(a,t,e=241)=>{let i=new te(a,t),n=new gt(e),s=new Pt(e+3),r=new Uint8ClampedArray(a*t),o=[];for(let c=0;c<90;c++)o.push({x:s.range(.02,.98),len:s.range(.25,.95),lean:s.range(-.28,.28),w:s.range(.004,.011),tone:s.range(0,1),dry:s.next()<.3});i.setAll((c,h,d,u,f)=>{c.setC(h,d,0,0,0),c.H[d*a+h]=0,c.R[d*a+h]=.9});for(let c of o){let h=Math.ceil(c.len*t);for(let d=0;d<h;d++){let u=d/h,f=Math.round(c.x*a+c.lean*u*u*a),g=Math.round((1-u*c.len)*t),y=Math.max(1,Math.round(c.w*a*(1-u*.7)));for(let p=-y;p<=y;p++){let m=f+p;if(m<0||m>=a||g<0||g>=t)continue;let x=g*a+m,b=.2+n.value2(m/a*20,g/t*20,20)*.16+c.tone*.12,_=c.dry?.55:0;i.C[x*3]=b*(.85+_*1.6),i.C[x*3+1]=b*(1+_*.55),i.C[x*3+2]=b*(.55+_*.25),i.H[x]=.5+u*.2,r[x]=255}}}let l=re(i,{normalStrength:.8,ao:.2});for(let c=0;c<a*t;c++)l.albedo[c*4+3]=r[c];return l};var va={concrete:{gen:bt.concrete,size:512,normalScale:1,rough:1},concrete_floor:{gen:bt.concrete_floor,size:512,normalScale:1},brick:{gen:bt.brick,size:512,normalScale:1},brick_grey:{gen:bt.brick_grey,size:256,normalScale:1},asphalt:{gen:bt.asphalt,size:512,normalScale:1},dirt:{gen:bt.dirt,size:512,normalScale:1},grass:{gen:bt.grass,size:512,normalScale:1},gravel:{gen:bt.gravel,size:256,normalScale:1},rust:{gen:bt.rust,size:256,normalScale:1},steel:{gen:bt.steel,size:512,normalScale:1},metal_paint:{gen:bt.metal_paint,size:256,normalScale:1},wood:{gen:bt.wood,size:512,normalScale:1},wood_weathered:{gen:bt.wood_weathered,size:256,normalScale:1},tiles:{gen:bt.tiles,size:512,normalScale:1},panel:{gen:bt.panel,size:256,normalScale:1},fabric:{gen:bt.fabric,size:256,normalScale:1},skin:{gen:bt.skin,size:256,normalScale:1},denim:{gen:bt.denim,size:256,normalScale:1},leather:{gen:bt.leather,size:256,normalScale:1},sand:{gen:bt.sand,size:256,normalScale:1},rock:{gen:bt.rock,size:512,normalScale:1},bark:{gen:bt.bark,size:256,normalScale:1},leaves:{gen:bt.leaves,size:256,normalScale:1,alpha:!0},blood:{gen:bt.blood,size:256,normalScale:1,alpha:!0,decal:!0},bullet:{gen:bt.bullet,size:128,normalScale:1,alpha:!0,decal:!0},hazard:{gen:bt.hazard,size:256,normalScale:1},flesh:{gen:bt.flesh,size:512,normalScale:1},armor:{gen:bt.armor,size:256,normalScale:1},nest:{gen:bt.nest,size:256,normalScale:1},radiation:{gen:bt.radiation,size:256,normalScale:1,emissive:!0},screen:{gen:bt.screen,size:256,normalScale:1,emissive:!0},corrugated:{gen:bt.corrugated,size:256,normalScale:1},paper:{gen:bt.paper,size:256,normalScale:1},grasscard:{gen:bt.grasscard,size:256,normalScale:1,alpha:!0}},uc=new Map;function ba(a,t){let e=va[a];if(!e)throw new Error("Unknown material: "+a);let i=t||e.size,n=a+":"+i;if(uc.has(n))return uc.get(n);let s=e.gen(i,i,1e3+Object.keys(va).indexOf(a)*37);return s.name=a,s.alpha=!!e.alpha,s.emissiveMap=!!e.emissive,uc.set(n,s),s}var ys={version:"1.0.0",title:"ASHES OF HUMANITY: LAST SIGNAL",world:{sizeX:1400,sizeZ:1e3,cell:400},player:{walkSpeed:3.5,sprintSpeed:6.6,crouchSpeed:1.9,adsSpeed:2.2,jumpVel:5,gravity:-18,accel:18,airAccel:4,height:1.78,crouchHeight:1.15,radius:.34,eyeHeight:1.62,staminaDrain:12,staminaRegen:16,staminaRegenDelay:.8,interactRange:2.6,maxCarry:45},survival:{hungerRate:.028,thirstRate:.042,tempRate:.06,radRate:.15,bleedRate:.35,infectRate:.02,stressRate:.03,hungerDmg:.02,thirstDmg:.03,coldDmg:.05,radDmg:.25},xp:{base:120,factor:1.115,max:50},loot:{respawn:900}},qe={water_bottle:{name:"Bottled Water",cat:"water",grid:[1,2],weight:.6,stack:5,value:12,desc:"Cloudy but drinkable. Restores hydration.",use:{thirst:42,stress:-3},color:"#8fb6c9"},water_dirty:{name:"Dirty Water",cat:"water",grid:[1,2],weight:.6,stack:5,value:4,desc:"Brown, metallic. Hydrates but risks infection.",use:{thirst:34,infection:6},color:"#7d7a56"},water_purified:{name:"Purified Water",cat:"water",grid:[1,2],weight:.6,stack:5,value:24,desc:"Filtered and boiled. Clean.",use:{thirst:55,stress:-4},color:"#a9d3e4"},canned_food:{name:"Canned Meat",cat:"food",grid:[1,1],weight:.4,stack:8,value:16,desc:"Decades past expiry. Still sealed.",use:{hunger:38},color:"#b5765a"},crackers:{name:"Army Crackers",cat:"food",grid:[1,1],weight:.25,stack:10,value:9,desc:"Dry ration bricks. Taste like cardboard.",use:{hunger:20,thirst:-5},color:"#c9b48a"},jerky:{name:"Dried Meat",cat:"food",grid:[1,1],weight:.3,stack:8,value:20,desc:"Unclear origin. Smoked thoroughly.",use:{hunger:30,stress:-2},color:"#8b5a44"},mushrooms:{name:"Glow Mushrooms",cat:"food",grid:[1,1],weight:.15,stack:12,value:6,desc:"From the tunnels. Mildly toxic, strangely filling.",use:{hunger:14,radiation:4},color:"#9dbf7a"},energy_bar:{name:"Energy Bar",cat:"food",grid:[1,1],weight:.2,stack:8,value:18,desc:"Raises stamina ceiling briefly.",use:{hunger:18,stamina:40},color:"#c5a35a"},bandage:{name:"Bandage",cat:"medicine",grid:[1,1],weight:.1,stack:10,value:10,desc:"Stops bleeding. Stops infection from spreading.",use:{bleed:-40,health:8},color:"#d8d2c4"},medkit:{name:"Field Medkit",cat:"medicine",grid:[2,1],weight:.9,stack:4,value:48,desc:"Sutures, antiseptic, morphine ampoule.",use:{health:65,bleed:-100},color:"#c9d6cf"},painkillers:{name:"Painkillers",cat:"medicine",grid:[1,1],weight:.1,stack:10,value:22,desc:"Masks pain. Clears stress.",use:{health:12,stress:-30},color:"#e0d8cc"},antibiotics:{name:"Antibiotics",cat:"medicine",grid:[1,1],weight:.1,stack:6,value:55,desc:"Treats infection outright.",use:{infection:-80,health:6},color:"#cfd8e0"},antirad:{name:"Anti-Rad Injection",cat:"medicine",grid:[1,1],weight:.15,stack:5,value:60,desc:"Binds isotopes in the blood.",use:{radiation:-70},color:"#c3b1d8"},splint:{name:"Splint",cat:"medicine",grid:[2,1],weight:.5,stack:3,value:34,desc:"Fixes fractured limbs.",use:{fracture:-100},color:"#b8a483"},stim_combat:{name:"Combat Stim",cat:"medicine",grid:[1,1],weight:.05,stack:6,value:70,desc:"Combat stim. Slows bleeding, sharpens aim.",use:{health:25,stamina:100,stress:-20},color:"#c96a5a"},battery:{name:"Battery Cell",cat:"electronics",grid:[1,1],weight:.2,stack:12,value:14,desc:"Powers the flashlight. Barely holds charge.",color:"#5f7d6a"},scrap:{name:"Scrap Metal",cat:"materials",grid:[1,1],weight:.5,stack:40,value:6,desc:"Twisted steel. Base of most recipes.",color:"#8d8d8d"},wood_plank:{name:"Wood Plank",cat:"materials",grid:[1,2],weight:1.2,stack:30,value:5,desc:"Splintered but usable.",color:"#a08055"},cloth:{name:"Cloth Scraps",cat:"materials",grid:[1,1],weight:.2,stack:40,value:4,desc:"Torn fabric. Dressings, straps, patching.",color:"#a09a88"},duct_tape:{name:"Duct Tape",cat:"materials",grid:[1,1],weight:.3,stack:15,value:10,desc:"Holds the world together.",color:"#9d9880"},wire:{name:"Copper Wire",cat:"materials",grid:[1,1],weight:.2,stack:20,value:8,desc:"Salvaged from walls and engines.",color:"#b0713c"},chemicals:{name:"Chemicals",cat:"materials",grid:[1,1],weight:.6,stack:16,value:12,desc:"Unlabelled industrial solvent.",color:"#8fa07a"},gunpowder:{name:"Gunpowder",cat:"materials",grid:[1,1],weight:.3,stack:30,value:15,desc:"Ground from propellant.",color:"#585551"},fuel:{name:"Diesel Canister",cat:"materials",grid:[2,2],weight:3,stack:3,value:40,desc:"Fuel for generators and fire.",color:"#c0a34a"},electronics:{name:"Circuit Board",cat:"electronics",grid:[1,1],weight:.2,stack:10,value:32,desc:"Scavenged control board. Why is it warm?",color:"#4a7a5a"},lens:{name:"Optical Lens",cat:"electronics",grid:[1,1],weight:.1,stack:8,value:28,desc:"Ground glass from a dead camera.",color:"#7fa4b0"},filter:{name:"Gas Mask Filter",cat:"electronics",grid:[1,1],weight:.3,stack:6,value:36,desc:"Filters fallout particulates.",color:"#77776a"},keycard:{name:"ZONE Keycard",cat:"quest",grid:[1,1],weight:.05,stack:1,value:0,desc:"Level-3 clearance. Red stripe worn away.",color:"#a34b4b"},dogtag:{name:"Dog Tags",cat:"quest",grid:[1,1],weight:.02,stack:20,value:15,desc:"Names of people nobody came back for.",color:"#b9b2a0"},green_badge:{name:"Green Badge",cat:"quest",grid:[1,1],weight:.05,stack:3,value:0,desc:"Marks the bearer as a Warden. Others will notice.",color:"#7fae72"},signal_core:{name:"Signal Core",cat:"quest",grid:[2,2],weight:2,stack:1,value:0,desc:"A fist of black crystal that hums at 14.7 kilohertz.",color:"#7a5fa8"},record_tape:{name:"Magnetic Tape",cat:"quest",grid:[1,1],weight:.1,stack:6,value:5,desc:"A recording. Somebody is still speaking on it.",color:"#6a5f4a"},artifact_shard:{name:"Resonance Shard",cat:"quest",grid:[1,1],weight:.3,stack:10,value:120,desc:"Crystallised sound. Worth a fortune to the right collector.",color:"#8fa8c8"},gasmask:{name:"Gas Mask",cat:"armor",slot:"head",grid:[2,1],weight:1.1,value:60,armor:6,radResist:.45,desc:"Filters air. Radiation resistance.",color:"#6f7a6a"},kevlar_vest:{name:"Kevlar Vest",cat:"armor",slot:"body",grid:[2,2],weight:4,value:140,armor:42,desc:"Stops pistol rounds. Barely.",color:"#5f6550"},warden_coat:{name:"Warden Coat",cat:"armor",slot:"body",grid:[2,2],weight:3.2,value:240,armor:38,radResist:.2,desc:"Rubberised coat of a signal warden.",color:"#4a5240"},hazmat_suit:{name:"Hazmat Suit",cat:"armor",slot:"body",grid:[2,2],weight:5,value:320,armor:12,radResist:.85,desc:"Sealed against the red waste.",color:"#c4b158"},backpack_small:{name:"Canvas Pack",cat:"equipment",slot:"back",grid:[2,2],weight:1,value:20,carry:12,desc:"Adds 12 kg of carry capacity.",color:"#7a6a4f"},backpack_military:{name:"Military Rucksack",cat:"equipment",slot:"back",grid:[2,3],weight:1.6,value:90,carry:26,desc:"Adds 26 kg of carry capacity.",color:"#4d5443"},flashlight:{name:"Damaged Flashlight",cat:"equipment",slot:"light",grid:[1,2],weight:.4,value:15,desc:"Flickers. Powerful enough to find a door.",color:"#8f8f7a"},flashlight_hd:{name:"Rail Flashlight",cat:"equipment",slot:"light",grid:[1,1],weight:.3,value:55,desc:"Steady beam. Mounts on a weapon rail.",color:"#8fa4b0"},radio:{name:"Old Radio",cat:"equipment",slot:"utility",grid:[2,1],weight:1.2,value:40,desc:"A relic from your brother. Sometimes it speaks.",color:"#6e5a3f"},geiger:{name:"Geiger Counter",cat:"equipment",slot:"utility",grid:[1,1],weight:.5,value:65,desc:"Clicks faster near the hot zones.",color:"#6b7d5a"}},Me={knife:{name:"Hunting Knife",type:"melee",dmg:26,rate:2.6,range:1.9,stam:6,weight:.4,grid:[1,2],durability:220,crit:.18,desc:"A blade worn down by years of work.",color:"#8a8f96"},pipe:{name:"Rebar Club",type:"melee",dmg:34,rate:1.7,range:2.3,stam:10,weight:2.2,grid:[1,3],durability:340,crit:.1,desc:"Heavy, unbalanced, and always in reach.",color:"#7d6a58"},fireaxe:{name:"Fire Axe",type:"melee",dmg:58,rate:1.15,range:2.5,stam:18,weight:3.4,grid:[2,3],durability:420,crit:.16,desc:"Stamped PROPERTY OF CITY FIRE DEPT. swings like guilt.",color:"#8b3a2f"},machete:{name:"Machete",type:"melee",dmg:44,rate:2,range:2.2,stam:11,weight:1.2,grid:[1,3],durability:300,crit:.15,desc:"Farming tool, repurposed.",color:"#7f8a70"},pistol:{name:"Makarov SM",type:"pistol",dmg:24,rate:5.2,mag:8,reserveType:"ammo_9mm",spread:.9,recoil:1.5,range:90,weight:.9,grid:[2,1],durability:260,reload:1.55,attachments:["suppressor","laser"],desc:"Sidearm of the old militia. Reliable, underpowered.",color:"#6d7278"},revolver:{name:"Model 64 Revolver",type:"pistol",dmg:46,rate:2.4,mag:6,reserveType:"ammo_38",spread:.7,recoil:2.6,range:110,weight:1.2,grid:[2,1],durability:320,reload:2.4,crit:.12,attachments:["scope_small"],desc:"A hunting revolver. Few rounds, loud consequences.",color:"#8a8272"},shotgun:{name:"Double-Barrel",type:"shotgun",dmg:22,pellets:9,rate:1.4,mag:2,reserveType:"ammo_12g",spread:5.5,recoil:5.5,range:28,weight:3.6,grid:[3,2],durability:300,reload:2.1,attachments:[],desc:"Break-action. Two chances, then you swing it.",color:"#7a5c40"},pump_shotgun:{name:"Pump Shotgun",type:"shotgun",dmg:20,pellets:9,rate:1.9,mag:6,reserveType:"ammo_12g",spread:4.8,recoil:4.2,range:34,weight:4.1,grid:[3,2],durability:420,reload:3.2,attachments:["flashlight","receiver"],desc:"Police issue. Every pump cycle is a promise.",color:"#4f5448"},hunting_rifle:{name:"Hunting Rifle",type:"rifle",dmg:82,rate:.85,mag:5,reserveType:"ammo_762",spread:.18,recoil:3.4,range:260,weight:4.4,grid:[4,2],durability:340,reload:2.8,attachments:["scope_medium","suppressor"],crit:.22,desc:"Bolt-action. A single breath, a single shot.",color:"#6a5a44"},assault_rifle:{name:"AK-Pattern Rifle",type:"rifle",dmg:38,rate:8.6,mag:30,reserveType:"ammo_762",spread:1.15,recoil:2.2,range:220,weight:4.9,grid:[4,2],durability:520,reload:2.5,attachments:["scope_small","suppressor","flashlight","receiver"],auto:!0,desc:"Standard of the exclusion zone garrison.",color:"#6b5334"},smg:{name:"Scav SMG",type:"smg",dmg:19,rate:12,mag:25,reserveType:"ammo_9mm",spread:1.9,recoil:1.1,range:70,weight:3,grid:[3,2],durability:380,reload:2,attachments:["suppressor","laser"],auto:!0,desc:"Welded from three dead guns and hope.",color:"#59605a"},crossbow:{name:"Compound Crossbow",type:"bow",dmg:68,rate:.6,mag:1,reserveType:"ammo_bolt",spread:.09,recoil:.6,range:140,weight:5.2,grid:[4,2],durability:260,reload:3.4,attachments:["scope_small"],silent:!0,crit:.3,desc:"Silent. Retrievable. Slower than fear.",color:"#3f4a3c"},improvised_shotgun:{name:"Pipe Shotgun",type:"shotgun",dmg:17,pellets:6,rate:.7,mag:1,reserveType:"ammo_12g",spread:7.5,recoil:7,range:16,weight:2.8,grid:[3,1],durability:90,reload:2.8,attachments:[],desc:"One pipe, one nail, one bad decision. May burst.",color:"#6a6355"}},Dg={ammo_9mm:{name:"9x18mm Rounds",grid:[1,1],weight:.012,stack:60,value:2,color:"#b3a06a"},ammo_38:{name:".38 Special",grid:[1,1],weight:.016,stack:40,value:3,color:"#c0a878"},ammo_12g:{name:"12ga Shells",grid:[1,1],weight:.05,stack:24,value:5,color:"#b0442f"},ammo_762:{name:"7.62x39mm Rounds",grid:[1,1],weight:.022,stack:45,value:4,color:"#c09a58"},ammo_bolt:{name:"Crossbow Bolts",grid:[1,2],weight:.06,stack:12,value:8,color:"#8a7a5c"}};var Ti={hollow:{name:"The Hollow",hp:90,speed:3.9,dmg:14,atkRange:1.9,atkRate:1.3,sight:26,hearing:34,scale:1.05,xp:45,threat:1,regions:["suburbs","city","industrial"],build:"humanoid",skin:"flesh",eyes:"#c9d8a0",desc:"A person whose face has been sanded away by something that feeds on sound.",tactics:"Hunts noise. Staggers at close range, screams when it loses you."},crawler:{name:"Crawler",hp:55,speed:6.4,dmg:11,atkRange:1.6,atkRate:2.2,sight:18,hearing:26,scale:.62,xp:30,threat:1,regions:["suburbs","forest","industrial","city"],build:"quadruped",skin:"flesh",eyes:"#e0e0c0",desc:"Low, fast, jointed wrong. It runs on four limbs and does not slow for corners.",tactics:"Circles, feints, attacks from behind. Retreats when shot."},watcher:{name:"Watcher",hp:130,speed:2.2,dmg:22,atkRange:12,atkRate:.5,sight:55,hearing:20,scale:1.9,xp:90,threat:2,regions:["forest","city","military","wasteland"],build:"tall",skin:"flesh",eyes:"#a8d0ff",ranged:!0,desc:"It stands at the treeline and looks. When it stops looking, it opens.",tactics:"Keeps distance, fires resonance pulses, calls others when you hide."},screamer:{name:"Screamer",hp:160,speed:3.2,dmg:9,atkRange:2.4,atkRate:.8,sight:30,hearing:40,scale:1.3,xp:80,threat:2,regions:["industrial","city","military"],build:"bloated",skin:"flesh",eyes:"#ff9a7a",desc:"Bloated with a sound it cannot stop making. It brings the others.",tactics:"Screams to summon. Explodes into corrosive gas when killed."},brute:{name:"Brute",hp:520,speed:2.9,dmg:38,atkRange:2.8,atkRate:.9,sight:24,hearing:22,scale:1.7,xp:220,threat:3,regions:["industrial","military","wasteland"],build:"brute",skin:"armor",eyes:"#ffb060",armor:.35,desc:"A wall of fused muscle and rusted plating. Slow until it is not.",tactics:"Charges, staggers hard, grabs. Weak at the exposed spine."},mimic:{name:"Mimic",hp:140,speed:4.4,dmg:26,atkRange:2.2,atkRate:1.1,sight:20,hearing:30,scale:1.2,xp:110,threat:2,regions:["suburbs","forest","city"],build:"humanoid",skin:"flesh",eyes:"#c0a0e0",desc:"It copies the sound of a child calling for help. It has been practising.",tactics:"Mimics distress sounds to lure you, then ambushes. Flees at low health."},burrower:{name:"Burrower",hp:110,speed:5,dmg:20,atkRange:2,atkRate:1.5,sight:12,hearing:45,scale:.9,xp:100,threat:2,regions:["forest","wasteland","industrial"],build:"quadruped",skin:"armor",eyes:"#a0ffd0",burrow:!0,desc:"It travels under the ground. You hear the soil shift before you see it.",tactics:"Burrows, surfaces behind the player, drags you down."},stalker:{name:"Stalker",hp:190,speed:5.4,dmg:30,atkRange:2.2,atkRate:1.4,sight:40,hearing:16,scale:1.35,xp:160,threat:3,regions:["forest","city","military"],build:"tall",skin:"flesh",eyes:"#ff6040",stealth:!0,desc:"It waits until you are alone and your light is off. Then it is closer than it was.",tactics:"Stalks invisibly, attacks isolated players, retreats from groups."},contaminated:{name:"The Contaminated",hp:240,speed:3.4,dmg:24,atkRange:2.4,atkRate:1,sight:28,hearing:26,scale:1.25,xp:170,threat:3,regions:["wasteland","industrial"],build:"humanoid",skin:"radiation",eyes:"#a0ff60",radioactive:!0,desc:"A body that kept moving after the isotope did its work.",tactics:"Irradiates the area around it. Attacks leave radiation."},pale:{name:"The Pale One",hp:300,speed:6,dmg:34,atkRange:2.4,atkRate:1.8,sight:50,hearing:30,scale:1.5,xp:300,threat:4,regions:["forest","wasteland","military"],nocturnal:!0,build:"tall",skin:"flesh",eyes:"#ffffff",albino:!0,desc:"Rare. Nocturnal. It does not chase \u2014 it arrives.",tactics:"Ambushes at night, disappears in light, extremely fast."}},zn={hollow_king:{name:"THE HOLLOW KING",mutant:"hollow",hp:2600,scale:2.3,phases:3,xp:1800,region:"suburbs",arena:"hollow_church",desc:"The first thing that learned to command the others. It wears a crown of jawbones.",attacks:["sweep","summon","scream_shock"],phaseText:["IT HEARS EVERY STEP","THE CHOIR ANSWERS","NO MORE SOUND"]},iron_abomination:{name:"THE IRON ABOMINATION",mutant:"brute",hp:4200,scale:2.6,phases:3,xp:2600,region:"industrial",arena:"foundry_pit",desc:"A forging machine that grew hungry, and then grew arms.",attacks:["charge","furnace_blast","debris_throw"],phaseText:["THE FORGE WAKES","MOLTEN FURY","SCRAP AND BONE"]},forest_matriarch:{name:"THE FOREST MATRIARCH",mutant:"stalker",hp:3600,scale:2.4,phases:3,xp:2400,region:"forest",arena:"nest_clearing",desc:"Older than the forest. The nest is hers; everything in it is hers.",attacks:["lunge","spawn_brood","web_bind"],phaseText:["SHE WAS ALWAYS HERE","THE BROOD STIRS","ROOT AND BONE"]},contaminated_titan:{name:"THE CONTAMINATED TITAN",mutant:"contaminated",hp:5200,scale:3,phases:3,xp:3200,region:"wasteland",arena:"crater_rim",desc:"A cooling tower that stood in the wrong place on the wrong day.",attacks:["rad_burst","stomp","toxic_wave"],phaseText:["THE AIR BURNS","HOT ZONE","ISOTOPE FURY"]},pale_commander:{name:"THE PALE COMMANDER",mutant:"pale",hp:4800,scale:2.2,phases:3,xp:3400,region:"military",arena:"bunker_gate",desc:"Someone signed orders here, once. Then kept signing them after.",attacks:["slash_combo","phase_shift","order_assault"],phaseText:["ORDERS ARE ORDERS","YOU WERE NOT ON THE LIST","DISMISSED"]},last_signal:{name:"THE LAST SIGNAL",mutant:"watcher",hp:7e3,scale:4.2,phases:4,xp:5e3,region:"wasteland",arena:"signal_array",desc:"It is not a creature. It is the broadcast that kept everyone listening.",attacks:["resonance_wave","askarene","echo_swarm","collapse"],phaseText:["DO YOU HEAR IT","IT KNOWS YOUR NAME","STOP LISTENING","..."]}},Vs={combat:{name:"COMBAT",icon:"crosshair",color:"#c05a4a",nodes:[{id:"c1",name:"Steady Hands",max:5,desc:"+6% weapon accuracy per rank.",effect:"accuracy",per:.06,req:[]},{id:"c2",name:"Trigger Discipline",max:5,desc:"-8% recoil per rank.",effect:"recoil",per:-.08,req:["c1"]},{id:"c3",name:"Brutal Cuts",max:4,desc:"+15% melee damage per rank.",effect:"meleeDmg",per:.15,req:[]},{id:"c4",name:"Quick Reload",max:3,desc:"-12% reload time per rank.",effect:"reload",per:-.12,req:["c2"]},{id:"c5",name:"Weak Point Insight",max:3,desc:"+20% critical damage per rank.",effect:"critDmg",per:.2,req:["c1"]},{id:"c6",name:"Adrenaline",max:3,desc:"+8 speed and +10% damage below 30% health.",effect:"adrenaline",per:1,req:["c2"]},{id:"c7",name:"Killing Floor",max:3,desc:"Kills restore 8% stamina.",effect:"killStamina",per:.08,req:["c3"]}]},survival:{name:"SURVIVAL",icon:"heart",color:"#8fae6a",nodes:[{id:"s1",name:"Iron Stomach",max:4,desc:"-15% hunger and thirst drain.",effect:"consumeRate",per:-.15,req:[]},{id:"s2",name:"Second Wind",max:5,desc:"+12 max stamina per rank.",effect:"staminaMax",per:12,req:[]},{id:"s3",name:"Thick Skin",max:5,desc:"+8 max health per rank.",effect:"healthMax",per:8,req:[]},{id:"s4",name:"Field Medicine",max:4,desc:"+20% healing effectiveness.",effect:"healing",per:.2,req:["s3"]},{id:"s5",name:"Cold Blooded",max:3,desc:"Halves temperature and radiation accumulation.",effect:"resistEnv",per:.33,req:["s1"]},{id:"s6",name:"Pain Tolerance",max:3,desc:"Bleeding and fracture penalties reduced.",effect:"bleedResist",per:.3,req:["s3"]},{id:"s7",name:"Pack Rat",max:3,desc:"+5kg carry capacity per rank.",effect:"carry",per:5,req:[]}]},engineering:{name:"ENGINEERING",icon:"wrench",color:"#6a9ab0",nodes:[{id:"e1",name:"Scrapper",max:5,desc:"+20% materials from disassembly.",effect:"salvage",per:.2,req:[]},{id:"e2",name:"Gunsmith",max:5,desc:"Craft weapons and ammo at 1 rank cheaper materials.",effect:"craftCheap",per:1,req:["e1"]},{id:"e3",name:"Field Repair",max:4,desc:"+25% weapon durability restored.",effect:"repair",per:.25,req:[]},{id:"e4",name:"Armorer",max:3,desc:"+10% armor effectiveness.",effect:"armor",per:.1,req:["e3"]},{id:"e5",name:"Builder",max:4,desc:"Structures have +30% health.",effect:"buildHp",per:.3,req:["e1"]},{id:"e6",name:"Electronics",max:3,desc:"Craft advanced components and blueprints.",effect:"electronics",per:1,req:["e2"]}]},exploration:{name:"EXPLORATION",icon:"compass",color:"#c9a86a",nodes:[{id:"x1",name:"Keen Eye",max:5,desc:"Highlight loot 6m further per rank.",effect:"lootSense",per:6,req:[]},{id:"x2",name:"Quiet Step",max:4,desc:"-15% noise generated.",effect:"noise",per:-.15,req:[]},{id:"x3",name:"Marathoner",max:4,desc:"-12% sprint stamina drain.",effect:"sprint",per:-.12,req:["x2"]},{id:"x4",name:"Scavenger",max:5,desc:"+15% chance of extra loot.",effect:"lootBonus",per:.15,req:["x1"]},{id:"x5",name:"Sixth Sense",max:3,desc:"Enemies within 20m are marked briefly.",effect:"sense",per:1,req:["x1"]},{id:"x6",name:"Climber",max:2,desc:"Vault faster and higher.",effect:"climb",per:1,req:["x3"]}]}},xs=[{id:"r_bandage",out:["bandage",2],in:{cloth:2},time:1,bench:0,cat:"Medical"},{id:"r_medkit",out:["medkit",1],in:{bandage:2,chemicals:1,cloth:1},time:3,bench:1,cat:"Medical"},{id:"r_purified",out:["water_purified",1],in:{water_dirty:1,cloth:1},time:4,bench:0,cat:"Survival"},{id:"r_antirad",out:["antirad",1],in:{chemicals:1,mushrooms:2,water_purified:1},time:4,bench:1,cat:"Medical"},{id:"r_antibiotics",out:["antibiotics",1],in:{chemicals:1,mushrooms:3},time:5,bench:1,cat:"Medical"},{id:"r_splint",out:["splint",1],in:{wood_plank:1,cloth:2},time:2,bench:0,cat:"Medical"},{id:"r_stim",out:["stim_combat",1],in:{chemicals:1,electronics:1,water_purified:1},time:6,bench:1,cat:"Medical"},{id:"r_ammo_9mm",out:["ammo_9mm",12],in:{gunpowder:2,scrap:1},time:2,bench:1,cat:"Ammunition"},{id:"r_ammo_762",out:["ammo_762",10],in:{gunpowder:3,scrap:2},time:2.5,bench:1,cat:"Ammunition"},{id:"r_ammo_12g",out:["ammo_12g",6],in:{gunpowder:2,scrap:1,chemicals:1},time:2.5,bench:1,cat:"Ammunition"},{id:"r_ammo_bolt",out:["ammo_bolt",3],in:{wood_plank:1,scrap:1,cloth:1},time:2,bench:1,cat:"Ammunition"},{id:"r_pipe",out:["pipe",1],in:{scrap:3,duct_tape:1},time:3,bench:1,cat:"Weapons"},{id:"r_improvised",out:["improvised_shotgun",1],in:{scrap:6,duct_tape:2,gunpowder:1},time:6,bench:1,cat:"Weapons"},{id:"r_knife",out:["knife",1],in:{scrap:2,wood_plank:1,duct_tape:1},time:3,bench:1,cat:"Weapons"},{id:"r_repair",out:["scrap",1],in:{},time:.2,bench:0,cat:"Hidden"},{id:"r_battery",out:["battery",1],in:{chemicals:1,wire:1,electronics:1},time:3,bench:1,cat:"Tools"},{id:"r_filter",out:["filter",1],in:{cloth:2,chemicals:1,scrap:1},time:4,bench:1,cat:"Tools"},{id:"r_gasmask",out:["gasmask",1],in:{filter:1,cloth:3,duct_tape:2},time:8,bench:2,cat:"Equipment"},{id:"r_kevlar",out:["kevlar_vest",1],in:{cloth:6,scrap:4,duct_tape:3},time:12,bench:2,cat:"Equipment"},{id:"r_backpack",out:["backpack_small",1],in:{cloth:5,duct_tape:2},time:6,bench:1,cat:"Equipment"},{id:"r_backpack_mil",out:["backpack_military",1],in:{cloth:8,scrap:3,duct_tape:3},time:10,bench:2,cat:"Equipment"},{id:"r_trap",out:["trap_spike",1],in:{wood_plank:3,scrap:3},time:5,bench:1,cat:"Building"},{id:"r_torch",out:["torch",1],in:{wood_plank:1,cloth:2,fuel:0},time:1,bench:0,cat:"Survival"}],Gs=[{id:"b_wall_wood",name:"Wooden Wall",size:[2.4,2.8,.18],cost:{wood_plank:3},hp:260,cat:"Structure"},{id:"b_wall_metal",name:"Sheet Metal Wall",size:[2.4,2.8,.12],cost:{scrap:4},hp:420,cat:"Structure"},{id:"b_floor",name:"Floor Section",size:[2.4,.16,2.4],cost:{wood_plank:2},hp:200,cat:"Structure"},{id:"b_door",name:"Door Frame",size:[1.4,2.2,.2],cost:{wood_plank:2,scrap:1},hp:220,cat:"Structure",door:!0},{id:"b_barricade",name:"Barricade",size:[2.2,1.3,.4],cost:{wood_plank:2,scrap:2},hp:180,cat:"Defense"},{id:"b_storage",name:"Storage Crate",size:[1.2,1,.9],cost:{wood_plank:2},hp:150,cat:"Utility",storage:24},{id:"b_workbench",name:"Workbench",size:[1.8,.95,.9],cost:{wood_plank:4,scrap:3},hp:200,cat:"Utility",bench:!0},{id:"b_lamp",name:"Hanging Lamp",size:[.4,.5,.4],cost:{scrap:1,wire:2,battery:1},hp:60,cat:"Utility",light:!0},{id:"b_fire",name:"Campfire",size:[1,.5,1],cost:{wood_plank:3,cloth:1},hp:80,cat:"Utility",light:!0,warmth:!0},{id:"b_trap",name:"Spike Trap",size:[1.2,.3,1.2],cost:{wood_plank:2,scrap:2},hp:90,cat:"Defense",damage:45}],J=(a,t,e=1,i=1)=>({id:a,w:t,min:e,max:i}),Ws={house:[J("cloth",22,1,4),J("canned_food",16),J("water_dirty",14),J("scrap",12,1,3),J("bandage",10),J("battery",8),J("crackers",10),J("water_bottle",8),J("duct_tape",6),J("pistol",2),J("ammo_9mm",6,4,12),J("knife",3),J("jerky",7),J("painkillers",4),J("radio",1),J("backpack_small",2),J("wood_plank",8,1,2)],kitchen:[J("canned_food",26),J("crackers",20),J("water_dirty",20),J("jerky",12),J("energy_bar",10),J("knife",8),J("cloth",8,1,2),J("mushrooms",4)],medical:[J("bandage",26,1,3),J("painkillers",18),J("medkit",12),J("antibiotics",10),J("splint",8),J("antirad",8),J("stim_combat",5),J("filter",6),J("chemicals",12,1,2),J("cloth",10,1,3)],military:[J("ammo_762",22,15,40),J("ammo_9mm",18,12,30),J("ammo_12g",12,4,12),J("kevlar_vest",6),J("assault_rifle",5),J("pump_shotgun",5),J("gasmask",8),J("dogtag",14),J("wire",8),J("gunpowder",12,1,4),J("keycard",3),J("stim_combat",6),J("backpack_military",4)],industrial:[J("scrap",30,2,6),J("wire",20,1,3),J("electronics",12),J("chemicals",16,1,3),J("fuel",10),J("duct_tape",12),J("gunpowder",10,1,3),J("battery",12),J("lens",8),J("metal_paint",0),J("pipe",6),J("improvised_shotgun",4)],store:[J("canned_food",24),J("water_bottle",22),J("crackers",18),J("energy_bar",12),J("clothes",0),J("battery",10),J("cloth",12,1,3),J("jerky",10),J("duct_tape",8),J("fuel",6)],tool:[J("scrap",26,1,4),J("duct_tape",18),J("wire",14,1,2),J("wood_plank",14,1,2),J("battery",12),J("lens",6),J("machete",6),J("fireaxe",5),J("gunpowder",8,1,2)],car:[J("scrap",24,1,3),J("fuel",16),J("wire",12),J("battery",14),J("cloth",10),J("ammo_9mm",6,2,8),J("duct_tape",8),J("pistol",2)],mutant:[J("flesh_scrap",0),J("artifact_shard",18),J("chemicals",22,1,2),J("mushrooms",20,1,3),J("gunpowder",10,1,2),J("cloth",12,1,2),J("record_tape",8)],warden:[J("record_tape",20),J("artifact_shard",16),J("electronics",18),J("stim_combat",10),J("green_badge",6),J("ammo_bolt",8,2,6),J("antirad",10),J("signal_core",2)],rare:[J("crossbow",8),J("hunting_rifle",8),J("revolver",10),J("hazmat_suit",6),J("warden_coat",6),J("ammo_bolt",10,3,8),J("record_tape",12),J("artifact_shard",12),J("electronics",10)]};function Bi(a){return qe[a]||Dg[a]||null}function wa(a){let t=Bi(a);return t?t.grid||[1,1]:Me[a]?Me[a].grid||[2,2]:[1,1]}function fc(a){let t=Bi(a);return t?t.weight||.1:Me[a]?Me[a].weight||1:.1}var hi=[{id:"suburbs",name:"THE DEAD SUBURBS",act:2,x0:-700,x1:-100,z0:0,z1:500,danger:1,sky:[.52,.56,.6],fog:.004,ground:"grass",desc:"Rows of identical houses, a school, a church. Everything at right angles. Nothing alive.",ambience:["wind","creaking","birds_far"]},{id:"forest",name:"BLACKWOOD FOREST",act:3,x0:-700,x1:-100,z0:-500,z1:0,danger:2,sky:[.36,.42,.4],fog:.011,ground:"grass",desc:"Pine so dense the maps gave up. Fog settles in the low ground and does not leave.",ambience:["wind","branches","crows"]},{id:"industrial",name:"THE INDUSTRIAL ZONE",act:4,x0:-100,x1:300,z0:0,z1:500,danger:3,sky:[.48,.48,.46],fog:.008,ground:"gravel",desc:"Foundries, chimneys, settling tanks. Something here still runs at night.",ambience:["metal","steam","hum"]},{id:"city",name:"THE FORGOTTEN CITY",act:5,x0:-100,x1:300,z0:-500,z1:0,danger:4,sky:[.44,.47,.52],fog:.007,ground:"asphalt",desc:"Six floors of apartments with nobody in them. The hospital lights still work.",ambience:["wind_gap","drips","distant_siren"]},{id:"military",name:"THE MILITARY EXCLUSION ZONE",act:6,x0:300,x1:700,z0:-500,z1:0,danger:5,sky:[.4,.44,.48],fog:.009,ground:"gravel",desc:"Checkpoints facing inward. Whatever they were keeping out, they failed.",ambience:["radio_static","wind","machinery"]},{id:"wasteland",name:"THE RED WASTELAND",act:7,x0:300,x1:700,z0:0,z1:500,danger:6,sky:[.52,.34,.28],fog:.013,ground:"sand",desc:"The crater is still warm. Ash falls upward here on the bad nights.",ambience:["radiation_storm","wind","geiger"]}];function qs(a,t){for(let e of hi)if(a>=e.x0&&a<e.x1&&t>=e.z0&&t<e.z1)return e;return hi[0]}var Xs=[{pts:[[-400,250],[-400,-250]],width:11,main:!0},{pts:[[-400,-250],[100,-250]],width:11,main:!0},{pts:[[100,-250],[500,-250]],width:11,main:!0},{pts:[[500,-250],[500,250]],width:11,main:!0},{pts:[[500,250],[100,250]],width:11,main:!0},{pts:[[100,250],[-400,250]],width:11,main:!0},{pts:[[-100,0],[300,0]],width:9,main:!0},{pts:[[-400,250],[-400,420]],width:7},{pts:[[100,-250],[100,-430]],width:7},{pts:[[-620,180],[-180,180]],width:7},{pts:[[-620,320],[-180,320]],width:7},{pts:[[-300,60],[-300,460]],width:6},{pts:[[-560,60],[-560,460]],width:6},{pts:[[-100,120],[300,120]],width:7},{pts:[[-100,380],[300,380]],width:7},{pts:[[440,40],[440,460]],width:6},{pts:[[580,40],[580,460]],width:6},{pts:[[-100,-120],[300,-120]],width:8},{pts:[[-100,-380],[300,-380]],width:8},{pts:[[40,-480],[40,-20]],width:8},{pts:[[180,-480],[180,-20]],width:8},{pts:[[300,-60],[680,-60]],width:7},{pts:[[300,-440],[680,-440]],width:7},{pts:[[360,-480],[360,-20]],width:6},{pts:[[620,-480],[620,-20]],width:6}];function _a(a,t,e,i,n,s){let r=n-e,o=s-i,l=r*r+o*o,c=l>0?((a-e)*r+(t-i)*o)/l:0;c=Z(c,0,1);let h=e+r*c,d=i+o*c;return Math.hypot(a-h,t-d)}var Ma=class{constructor(t=90210){this.seed=t,this.N=new gt(t),this.N2=new gt(t+77),this.N3=new gt(t+311),this.rng=new Pt(t),this.halfX=700,this.halfZ=500,this.crater={x:560,z:300,r:95,depth:26},this.lake={x:470,z:150,r:46,level:-2.6},this.river=[[-660,-180],[-520,-120],[-420,-60],[-330,-20],[-250,40],[-180,120],[-140,200]],this.roadCache=new Map,this.pads=[],this.padGrid=new Map,this.padCell=48}addPad(t,e,i,n,s,r,o=3,l="building"){let c={x:t,z:e,hw:i,hd:n,ry:s,y:r,cos:Math.cos(s),sin:Math.sin(s),blend:o,tag:l};this.pads.push(c);let h=Math.hypot(i,n)+o,d=Math.floor((t-h)/this.padCell),u=Math.floor((t+h)/this.padCell),f=Math.floor((e-h)/this.padCell),g=Math.floor((e+h)/this.padCell);for(let y=d;y<=u;y++)for(let p=f;p<=g;p++){let m=y*92821+p,x=this.padGrid.get(m);x||(x=[],this.padGrid.set(m,x)),x.push(c)}return c}padsAt(t,e){let i=Math.floor(t/this.padCell)*92821+Math.floor(e/this.padCell);return this.padGrid.get(i)||null}padLocal(t,e,i){let n=e-t.x,s=i-t.z;return[n*t.cos+s*t.sin,-n*t.sin+s*t.cos]}regionFactor(t,e){return{suburbs:t<-100&&e>=0,forest:t<-100&&e<0,industrial:t>=-100&&t<300&&e>=0,city:t>=-100&&t<300&&e<0,military:t>=300&&e<0,wasteland:t>=300&&e>=0}}roadDist(t,e){let i=(t/8|0)*100003+(e/8|0),n=this.roadCache.get(i);if(n!==void 0)return n;let s=1e9;for(let l of Xs)for(let c=0;c<l.pts.length-1;c++){let h=l.pts[c],d=l.pts[c+1];if(t<Math.min(h[0],d[0])-40||t>Math.max(h[0],d[0])+40||e<Math.min(h[1],d[1])-40||e>Math.max(h[1],d[1])+40)continue;let u=_a(t,e,h[0],h[1],d[0],d[1]);u<s&&(s=u)}let r=9;for(let l of Xs)for(let c=0;c<l.pts.length-1;c++){let h=l.pts[c],d=l.pts[c+1],u=_a(t,e,h[0],h[1],d[0],d[1]);if(Math.abs(u-s)<.001){r=l.width;break}}let o={d:s,w:r};return this.roadCache.set(i,o),o}riverDist(t,e){let i=1e9;for(let n=0;n<this.river.length-1;n++){let s=this.river[n],r=this.river[n+1],o=_a(t,e,s[0],s[1],r[0],r[1]);o<i&&(i=o)}return i}baseHeight(t,e){let i=this.N,n=this.N2,s=this.N3,r=t/420+5,o=e/420+5,l=0;if(t<-100&&e<0){l=6+i.fbm2(r*1.6,o*1.6,5,64)*26+n.fbm2(r*5,o*5,3,256)*5;let y=Ft((s.fbm2(r*1.1,o*1.1,3,64)-.45)*3);l-=y*7,l+=n.ridged(r*3,o*3,3,128)*6}else t<-100&&e>=0?(l=2.2+i.fbm2(r*2,o*2,4,64)*6.5+n.fbm2(r*8,o*8,2,256)*.9,l*=.85):t<300&&e<0?(l=3.4+i.fbm2(r*1.8,o*1.8,3,64)*3.2,l=Rt(l,2,.5)):t<300&&e>=0?l=1.2+i.fbm2(r*2.4,o*2.4,3,64)*2.4+n.ridged(r*6,o*6,2,128)*1.6:e<0?l=8+i.fbm2(r*1.9,o*1.9,5,64)*22+n.ridged(r*4,o*4,4,128)*12:(l=4+i.fbm2(r*2.6,o*2.6,5,64)*12+n.fbm2(r*9,o*9,3,256)*2.5,l+=s.ridged(r*3.2,o*3.2,3,128)*7);let c=Math.max(0,Math.abs(t)-620)/80,h=Math.max(0,Math.abs(e)-420)/80,d=Math.max(c,h);l+=Ft(d)*65;let u=Math.hypot(t-this.crater.x,e-this.crater.z);if(u<this.crater.r*2.2){let y=1-Ft(u/(this.crater.r*2.2));l-=this.crater.depth*Math.pow(1-Ft(u/this.crater.r),2)*1.1;let p=Math.abs(u-this.crater.r*1.05)/(this.crater.r*.35);l+=Ft(1-p)*7*y,l+=(n.fbm2(r*14,o*14,2,256)-.5)*6*y}let f=this.riverDist(t,e);if(f<40){let y=1-Ft(f/40);l=Rt(l,-3.4,y*.95)}let g=Math.hypot(t-this.lake.x,e-this.lake.z);if(g<this.lake.r*1.4){let y=1-Ft(g/(this.lake.r*1.4));l=Rt(l,this.lake.level-1.5,y*.95)}return l}heightAt(t,e){let i=this.baseHeight(t,e),n=this.roadDist(t,e);if(n.d<26){let r=this.roadHeight(t,e),o=1-Ft((n.d-n.w*.6)/12);i=Rt(i,r,o*.92)}let s=this.padsAt(t,e);if(s)for(let r=0;r<s.length;r++){let o=s[r],[l,c]=this.padLocal(o,t,e),h=Math.abs(l)-o.hw,d=Math.abs(c)-o.hd,u=Math.max(h,d);u<=0?i=o.y:u<o.blend&&(i=Rt(o.y,i,Ft(u/o.blend)))}return i}rawHeightAt(t,e){let i=this.baseHeight(t,e),n=this.roadDist(t,e);if(n.d<26){let s=this.roadHeight(t,e),r=1-Ft((n.d-n.w*.6)/12);i=Rt(i,s,r*.92)}return i}roadHeight(t,e){let i=1e9,n=0;for(let s of Xs)for(let r=0;r<s.pts.length-1;r++){let o=s.pts[r],l=s.pts[r+1],c=_a(t,e,o[0],o[1],l[0],l[1]);if(c<i){i=c;let h=(o[0]+l[0])/2,d=(o[1]+l[1])/2;n=this.baseHeight(h,d)}}return n}normalAt(t,e,i=.6){let n=this.heightAt(t-i,e),s=this.heightAt(t+i,e),r=this.heightAt(t,e-i),o=this.heightAt(t,e+i);return new P(n-s,2*i,r-o).normalize()}weightsAt(t,e){let n=1-this.normalAt(t,e,1.2).y,s=this.roadDist(t,e),r=this.regionFactor(t,e),o=s.d<s.w*.62?1:s.d<s.w*1.1?1-Ft((s.d-s.w*.62)/(s.w*.48)):0;o=Math.min(o,.97);let l=Ft((n-.18)*3.2),c=0,h=0,d=0,u=0;r.wasteland?(c=.85,u=.05,d=.1):r.military?(h=.5,d=.3,u=.2):r.industrial?(h=.55,d=.35,u=.1):r.city?(h=.34,d=.38,u=.28):r.forest?(u=.7,d=.22,h=.08):(u=.56,d=.32,h=.12);let f=this.N3.fbm2(t/40,e/40,3,64);u*=.6+f*.8,d*=.6+(1-f)*.7,this.riverDist(t,e)<20&&(d=Math.max(d,.7),u*=.3);let y=u+d+c+h;u/=y,d/=y,c/=y,h/=y;let p=1-o,m=l,x={grass:u*p*(1-m*.85),dirt:d*p*(1-m*.7),sand:c*p*(1-m*.6),asphalt:o,rock:Math.min(1,m*p+o*.02)},v="grass";return o>.5?v="concrete":x.rock>.5?v="gravel":c>.45?v="sand":h>.4?v="gravel":d>.5&&(v="dirt"),x.type=v,x.road=o>.35,x}build(t,e={}){let i=e.step||4,n=64,s=Math.ceil(this.halfX*2/i),r=Math.ceil(this.halfZ*2/i),o=new Kt;o.name="terrain";let l=Math.floor(this.halfX*2/1),c=Math.floor(this.halfZ*2/1),h=new Uint8Array(l*c*4);for(let p=0;p<c;p++)for(let m=0;m<l;m++){let x=-this.halfX+(m+.5)*1,v=-this.halfZ+(p+.5)*1,b=this.weightsAt(x,v),_=(p*l+m)*4;h[_]=Math.round(Z(b.grass,0,1)*255),h[_+1]=Math.round(Z(b.dirt,0,1)*255),h[_+2]=Math.round(Z(b.sand+b.rock*.15,0,1)*255),h[_+3]=Math.round(Z(b.asphalt+b.rock,0,1)*255)}let d=new yn(h,l,c,je,li);this.splatSize={w:l,h:c},d.wrapS=d.wrapT=Zi,d.minFilter=We,d.magFilter=We,d.colorSpace=gi,d.needsUpdate=!0,this._splatData=h;let u=this.makeMaterial(d);this.splatTex=d,this.material=u;let f=Math.ceil(this.halfX*2/n),g=Math.ceil(this.halfZ*2/n),y=Math.ceil(n/i);for(let p=0;p<g;p++)for(let m=0;m<f;m++){let x=-this.halfX+m*n,v=-this.halfZ+p*n,b=new ze(n,n,y,y),_=b.attributes.position,A=b.attributes.uv,T=new Float32Array(_.count*3);for(let D=0;D<_.count;D++){let w=_.getX(D),M=_.getY(D),L=x+w+n/2,U=v-M+n/2,H=this.heightAt(L,U);_.setZ(D,H),A.setXY(D,(L+this.halfX)/(this.halfX*2),(U+this.halfZ)/(this.halfZ*2));let Y=this.weightsAt(L,U),B=.88+this.N.fbm2(L/18,U/18,3,32)*.24;T[D*3]=B*(.84+Y.sand*.2),T[D*3+1]=B,T[D*3+2]=B}b.setAttribute("color",new de(T,3)),b.rotateX(-Math.PI/2),b.translate(x+n/2,0,v+n/2),b.computeVertexNormals();let k=new At(b,u);k.receiveShadow=!0,k.castShadow=!1,k.name=`terrain_${m}_${p}`,k.userData.terrain=!0,o.add(k)}return t&&t.add(o),this.group=o,o}makeMaterial(t){let i=["grass","dirt","sand","asphalt","rock"].map(o=>ba(o)),n=(o,l)=>{let c=new yn(o,i[0].width,i[0].height,je,li);return c.wrapS=c.wrapT=Pn,c.magFilter=We,c.minFilter=Pi,c.generateMipmaps=!0,c.anisotropy=8,c.colorSpace=l?Ye:gi,c.needsUpdate=!0,c},s={splat:{value:t},tGrass:{value:n(i[0].albedo,!0)},tDirt:{value:n(i[1].albedo,!0)},tSand:{value:n(i[2].albedo,!0)},tAsphalt:{value:n(i[3].albedo,!0)},tRock:{value:n(i[4].albedo,!0)},nRock:{value:n(i[4].normal,!1)},nDirt:{value:n(i[1].normal,!1)},tScale:{value:.25},wetness:{value:0}},r=new Li({color:16777215,roughness:.95,metalness:0,vertexColors:!0});return r.onBeforeCompile=o=>{Object.assign(o.uniforms,s),o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vWorldPos;
varying vec3 vNormalW;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
          vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
          vNormalW = normalize(mat3(modelMatrix) * objectNormal);`),o.fragmentShader=o.fragmentShader.replace("#include <common>",`#include <common>
          uniform sampler2D splat, tGrass, tDirt, tSand, tAsphalt, tRock, nRock, nDirt;
          uniform float tScale, wetness;
          varying vec3 vWorldPos;
          varying vec3 vNormalW;`).replace("#include <map_fragment>",`
          vec4 sp = texture2D(splat, (vWorldPos.xz - vec2(-700.0, -500.0)) / vec2(1400.0, 1000.0));
          vec2 duv = vWorldPos.xz * tScale;
          vec3 cG = texture2D(tGrass, duv).rgb * 0.62 + texture2D(tGrass, duv * 3.7).rgb * 0.28 + texture2D(tGrass, duv * 11.0).rgb * 0.14;
          vec3 cD = texture2D(tDirt, duv * 0.8).rgb * 0.7 + texture2D(tDirt, duv * 4.3).rgb * 0.3;
          vec3 cS = texture2D(tSand, duv * 1.3).rgb * 0.7 + texture2D(tSand, duv * 5.1).rgb * 0.3;
          vec3 cA = texture2D(tAsphalt, duv).rgb * 0.75 + texture2D(tAsphalt, duv * 4.0).rgb * 0.25;
          vec3 cR = texture2D(tRock, duv * 0.7).rgb * 0.7 + texture2D(tRock, duv * 3.1).rgb * 0.3;
          float sw = sp.r + sp.g + sp.b + sp.a + 0.0001;
          vec3 ground = (cG * sp.r + cD * sp.g + cS * sp.b + cA * sp.a * 0.96 + cR * sp.a * 0.1) / sw;
          float slopeRock = smoothstep(0.35, 0.75, 1.0 - vNormalW.y);
          ground = mix(ground, cR * 0.85, slopeRock * 0.6);
          float macro = texture2D(tDirt, vWorldPos.xz * 0.0125).r;
          float macro2 = texture2D(tSand, vWorldPos.xz * 0.006).g;
          ground *= mix(0.72, 1.12, macro * 0.6 + macro2 * 0.4);
          // dry/wet patchiness
          float patchTex = texture2D(tGrass, vWorldPos.xz * 0.045).r;
          ground = mix(ground, ground * vec3(1.10, 0.98, 0.80), smoothstep(0.45, 0.8, patchTex) * 0.5);
          diffuseColor.rgb *= ground;
        `).replace("#include <roughnessmap_fragment>",`
          float roughnessFactor = clamp(mix(0.95, 0.55, sp.a * 0.7) - wetness * 0.25, 0.18, 1.0);
        `).replace("#include <normal_fragment_maps>",`
          // build the tangent frame from screen-space derivatives: the ground
          // material has no tangent attribute (and no normalMap slot), so the
          // stock tbn matrix is not declared here.
          vec3 mapN1 = texture2D(nRock, vWorldPos.xz * tScale * 0.7).xyz * 2.0 - 1.0;
          vec3 mapN2 = texture2D(nDirt, vWorldPos.xz * tScale).xyz * 2.0 - 1.0;
          vec3 mapN = mix(mapN2, mapN1, slopeRock);
          mapN.xy *= 0.9;
          // screen-space derivatives become degenerate (and produce NaNs that
          // render as a white sheet) on ground seen at grazing angles, so build
          // the tangent frame from the world normal instead.
          vec3 nW = normalize(vNormalW);
          vec3 upRef = abs(nW.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
          vec3 tW = normalize(cross(upRef, nW));
          vec3 bW = normalize(cross(nW, tW));
          normal = normalize(tW * mapN.x + bW * mapN.y + nW * mapN.z);
        `)},r.userData.terrain=!0,r.userData.splat=this.splatSize?{width:this.splatSize.w,height:this.splatSize.h,data:this._splatData}:null,r.userData.sets=i,r}setWetness(t){this.material&&(this.material.userData.wetness=t)}dispose(){this.group&&(this.group.traverse(t=>{t.isMesh&&t.geometry.dispose()}),this.group.parent&&this.group.parent.remove(this.group))}};function Un(a,t=!1){let e=a[0].index!==null,i=new Set(Object.keys(a[0].attributes)),n=new Set(Object.keys(a[0].morphAttributes)),s={},r={},o=a[0].morphTargetsRelative,l=new ke,c=0;for(let h=0;h<a.length;++h){let d=a[h],u=0;if(e!==(d.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in d.attributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;s[f]===void 0&&(s[f]=[]),s[f].push(d.attributes[f]),u++}if(u!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==d.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in d.morphAttributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;r[f]===void 0&&(r[f]=[]),r[f].push(d.morphAttributes[f])}if(t){let f;if(e)f=d.index.count;else if(d.attributes.position!==void 0)f=d.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(e){let h=0,d=[];for(let u=0;u<a.length;++u){let f=a[u].index;for(let g=0;g<f.count;++g)d.push(f.getX(g)+h);h+=a[u].attributes.position.count}l.setIndex(d)}for(let h in s){let d=ld(s[h]);if(!d)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,d)}for(let h in r){let d=r[h][0].length;if(d===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let u=0;u<d;++u){let f=[];for(let y=0;y<r[h].length;++y)f.push(r[h][y][u]);let g=ld(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}return l}function ld(a){let t,e,i,n=-1,s=0;for(let c=0;c<a.length;++c){let h=a[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=h.normalized),i!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(n===-1&&(n=h.gpuType),n!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=h.count*e}let r=new t(s),o=new de(r,e,i),l=0;for(let c=0;c<a.length;++c){let h=a[c];if(h.isInterleavedBufferAttribute){let d=l/e;for(let u=0,f=h.count;u<f;u++)for(let g=0;g<e;g++){let y=h.getComponent(u,g);o.setComponent(u+d,g,y)}}else r.set(h.array,l);l+=h.count*e}return n!==void 0&&(o.gpuType=n),o}var pc=new Map,vs=new Map;function Ng(a,t){let e=a+":"+t;if(pc.has(e))return pc.get(e);let i=ba(a,t),n=(r,o)=>{let l=new yn(r,i.width,i.height,je,li);return l.colorSpace=o?Ye:gi,l.wrapS=l.wrapT=Pn,l.magFilter=We,l.minFilter=Pi,l.generateMipmaps=!0,l.anisotropy=8,l.needsUpdate=!0,l},s={set:i,map:n(i.albedo,!0),normalMap:n(i.normal,!1),ormMap:n(i.orm,!1),emissiveMap:i.emissive?n(i.emissive,!0):null};return pc.set(e,s),s}function vt(a,t={}){let e=va[a];if(!e)throw new Error("Unknown material "+a);let i=t.size||e.size,n=JSON.stringify([a,i,t.color??null,t.repeat??null,t.roughness??null,t.metalness??null,t.emissive??null,t.emissiveIntensity??null,t.transparent??null,t.opacity??null,t.side??null,t.alphaTest??null,t.depthWrite??null,t.unlit??null,t.normalScale??null,t.polygonOffset??null]);if(vs.has(n))return vs.get(n);let s=Ng(a,i),r=t.repeat||[1,1],o=s.map.clone();o.repeat.set(r[0],r[1]),o.needsUpdate=!0;let l=s.normalMap.clone();l.repeat.set(r[0],r[1]),l.needsUpdate=!0;let c=s.ormMap.clone();c.repeat.set(r[0],r[1]),c.needsUpdate=!0;let h=new Li({map:o,normalMap:l,roughnessMap:c,metalnessMap:c,aoMap:c,aoMapIntensity:1,color:t.color!==void 0?new mt(t.color):16777215,roughness:t.roughness!==void 0?t.roughness:1,metalness:t.metalness!==void 0?t.metalness:1,normalScale:new Xt(t.normalScale??1,t.normalScale??1),transparent:!!t.transparent,opacity:t.opacity!==void 0?t.opacity:1,side:t.side!==void 0?t.side:Ii,alphaTest:t.alphaTest||0,depthWrite:t.depthWrite!==void 0?t.depthWrite:!0,polygonOffset:!!t.polygonOffset,polygonOffsetFactor:t.polygonOffset?-1:0,polygonOffsetUnits:t.polygonOffset?-1:0});if(s.emissiveMap){let d=s.emissiveMap.clone();d.repeat.set(r[0],r[1]),d.needsUpdate=!0,h.emissiveMap=d,h.emissive=new mt(t.emissive??16777215),h.emissiveIntensity=t.emissiveIntensity??1}else t.emissive&&(h.emissive=new mt(t.emissive),h.emissiveIntensity=t.emissiveIntensity??1);return h.userData.texName=a,h.userData.repeat=r,h.userData.unlit=!!t.unlit,h.userData.noShadow=!!t.noShadow,t.unlit&&(h.emissive=new mt(16777215),h.emissiveMap=o,h.emissiveIntensity=1,h.color=new mt(0),h.roughness=1,h.metalness=0),vs.set(n,h),h}function ye(a,t={}){let e="plain:"+a+JSON.stringify(t);if(vs.has(e))return vs.get(e);let i=new Li({color:a,roughness:t.roughness??.85,metalness:t.metalness??0,transparent:!!t.transparent,opacity:t.opacity??1,emissive:t.emissive??0,emissiveIntensity:t.emissiveIntensity??1,side:t.side??Ii,depthWrite:t.depthWrite??!0,alphaTest:t.alphaTest??0});return i.userData.texName=t.texName||null,i.userData.noShadow=!!t.noShadow,i.userData.unlit=!!t.unlit,vs.set(e,i),i}var E={get concrete(){return vt("concrete",{color:16777215,repeat:[1,1],normalScale:1.2})},get concreteWet(){return vt("concrete",{color:14474458,roughness:.62,normalScale:1.2})},get floor(){return vt("concrete_floor",{color:15921388})},get brick(){return vt("brick",{color:16777215})},get brickGrey(){return vt("brick_grey",{color:16052974})},get asphalt(){return vt("asphalt",{color:16777215})},get dirt(){return vt("dirt",{color:16777215})},get grass(){return vt("grass",{color:16777215})},get gravel(){return vt("gravel",{color:16777215})},get rust(){return vt("rust",{color:16777215})},get steel(){return vt("steel",{color:16777215})},get metalPaint(){return vt("metal_paint",{color:15790830})},get wood(){return vt("wood",{color:16777215})},get woodWeathered(){return vt("wood_weathered",{color:16777215})},get tiles(){return vt("tiles",{color:16777215})},get panel(){return vt("panel",{color:16777215})},get fabric(){return vt("fabric",{color:16777215})},get skin(){return vt("skin",{color:16777215,normalScale:.7})},get denim(){return vt("denim",{color:16777215})},get leather(){return vt("leather",{color:16777215})},get sand(){return vt("sand",{color:16777215})},get rock(){return vt("rock",{color:16777215})},get bark(){return vt("bark",{color:16777215})},get leaves(){return vt("leaves",{color:9411182,side:_e,alphaTest:.45,normalScale:.5,noShadow:!0})},get hazard(){return vt("hazard",{color:16777215})},get flesh(){return vt("flesh",{color:16777215})},get armor(){return vt("armor",{color:16777215})},get nest(){return vt("nest",{color:16777215})},get corrugated(){return vt("corrugated",{color:16777215})},get paper(){return vt("paper",{color:16777215})},get grassCard(){return vt("grasscard",{color:16777215,side:_e,alphaTest:.42,normalScale:.4,noShadow:!0,roughness:.95})},get water(){return vt("water",{color:16777215})},get glass(){return ye(9413800,{roughness:.06,metalness:.1,transparent:!0,opacity:.28,depthWrite:!1})},get darkGlass(){return ye(2765364,{roughness:.15,metalness:.3,transparent:!0,opacity:.7})}};var tn=2,cd=new Qt,hd=new ei,dd=new Be,ud=new P,mc=new P;function C(a,t,e,i=tn,n=0){let s=new Qi(Math.max(.001,a),Math.max(.001,t),Math.max(.001,e)),r=s.attributes.uv,o=[[e,t],[e,t],[a,e],[a,e],[a,t],[a,t]];for(let l=0;l<6;l++){let[c,h]=o[l];for(let d=l*4;d<l*4+4;d++)r.setXY(d,r.getX(d)*c/i+n,r.getY(d)*h/i)}return s.attributes.uv.needsUpdate=!0,s}function fd(a,t,e=tn,i=0,n=0){let s=new ze(a,t,1,1),r=s.attributes.uv;for(let o=0;o<r.count;o++)r.setXY(o,r.getX(o)*a/e+i,r.getY(o)*t/e+n);return s.rotateX(-Math.PI/2),s}function rt(a,t,e,i=10,n=tn,s=!1){let r=new ii(a,t,e,i,1,s),o=r.attributes.uv,l=Math.PI*(a+t)/2*2;for(let c=0;c<o.count;c++)o.setXY(c,o.getX(c)*l/n,o.getY(c)*e/n);return r.attributes.uv.needsUpdate=!0,r}function Je(a,t=12,e=tn){let i=new Ei(a,t,Math.max(4,t>>1)),n=i.attributes.uv,s=2*Math.PI*a;for(let r=0;r<n.count;r++)n.setXY(r,n.getX(r)*s/e,n.getY(r)*s/e);return i.attributes.uv.needsUpdate=!0,i}function pd(a,t,e=8,i=tn){return rt(.001,a,t,e,i)}var Sa=class{constructor(t,e={}){this.scene=t,this.buckets=new Map,this.colliders=[],this.group=new Kt,this.group.name=e.name||"static",this.staticOnly=e.staticOnly||!1,this.castShadow=e.castShadow!==!1,this.receiveShadow=e.receiveShadow!==!1,this.triCount=0,t&&t.add(this.group)}_bucket(t){let e=t.uuid,i=this.buckets.get(e);return i||(i={mat:t,geoms:[]},this.buckets.set(e,i)),i}add(t,e,i=0,n=0,s=0,r=[0,0,0],o=1){if(!t||!e)return null;if(Array.isArray(t)){for(let c of t)this.add(c,e,i,n,s,r,o);return null}let l=t.index?t.toNonIndexed():t.clone();for(let c of Object.keys(l.attributes))["position","normal","uv"].includes(c)||l.deleteAttribute(c);return ud.set(i,n,s),dd.set(r[0]||0,r[1]||0,r[2]||0),hd.setFromEuler(dd),typeof o=="number"?mc.set(o,o,o):mc.set(o.x??1,o.y??1,o.z??1),cd.compose(ud,hd,mc),l.applyMatrix4(cd),this._bucket(e).geoms.push(l),this.triCount+=l.attributes.position.count/3,l}box(t,e,i,n,s,r,o,l={}){return this.add(C(n,s,r,l.texScale||tn,l.uOff||0),o,t,e,i,l.rot||[0,0,0]),l.collide!==!1&&this.collideBox(t-n/2,e-s/2,i-r/2,t+n/2,e+s/2,i+r/2,l.tag||"wall"),this}addCollider(t,e,i,n,s,r,o="wall"){this.colliders.push({minX:Math.min(t,n),maxX:Math.max(t,n),minY:Math.min(e,s),maxY:Math.max(e,s),minZ:Math.min(i,r),maxZ:Math.max(i,r),tag:o})}collideBox(t,e,i,n,s,r,o){this.addCollider(t,e,i,n,s,r,o)}wallX(t,e,i,n,s,r=.25,o=E.concrete,l=[],c={}){let h=this._splitByHoles(t,e,n,s,l);for(let d of h){let u=d.x1-d.x0,f=d.y1-d.y0;u<=.001||f<=.001||(this.add(C(u,f,r,c.texScale||tn),o,(d.x0+d.x1)/2,(d.y0+d.y1)/2,i),c.collide!==!1&&this.collideBox(d.x0,d.y0,i-r/2,d.x1,d.y1,i+r/2,"wall"))}return this}wallZ(t,e,i,n,s,r=.25,o=E.concrete,l=[],c={}){let h=this._splitByHoles(t,e,n,s,l);for(let d of h){let u=d.x1-d.x0,f=d.y1-d.y0;u<=.001||f<=.001||(this.add(C(r,f,u,c.texScale||tn),o,i,(d.y0+d.y1)/2,(d.x0+d.x1)/2),c.collide!==!1&&this.collideBox(i-r/2,d.y0,d.x0,i+r/2,d.y1,d.x1,"wall"))}return this}_splitByHoles(t,e,i,n,s){let r=[],o=s.filter(c=>c.x1>t&&c.x0<e&&c.y1>i&&c.y0<n).map(c=>({x0:Math.max(t,c.x0),x1:Math.min(e,c.x1),y0:Math.max(i,c.y0),y1:Math.min(n,c.y1)})).sort((c,h)=>c.x0-h.x0),l=t;for(let c of o)c.x0>l&&r.push({x0:l,x1:c.x0,y0:i,y1:n}),c.y0>i&&r.push({x0:c.x0,x1:c.x1,y0:i,y1:c.y0}),c.y1<n&&r.push({x0:c.x0,x1:c.x1,y0:c.y1,y1:n}),l=Math.max(l,c.x1);return l<e&&r.push({x0:l,x1:e,y0:i,y1:n}),r}slab(t,e,i,n,s,r=E.floor,o=.2,l={}){let c=i-t,h=n-e;return this.add(C(c,o,h,l.texScale||tn),r,(t+i)/2,s-o/2,(e+n)/2),l.collide!==!1&&this.collideBox(t,s-o,e,i,s,n,"floor"),this}ceiling(t,e,i,n,s,r=E.concrete,o=.25){let l=i-t,c=n-e;return this.add(C(l,o,c),r,(t+i)/2,s+o/2,(e+n)/2),this.collideBox(t,s,e,i,s+o,n,"ceiling"),this}stairs(t,e,i,n,s,r=1.6,o=E.floor){let l=Math.max(3,Math.round(Math.abs(s-n)/.2)),c=(i-e)/l,h=(s-n)/l;for(let d=0;d<l;d++){let u=n+h*(d+1),f=e+c*(d+.5),g=u-n;this.add(C(r,.22,Math.abs(c)+.02),o,t,u-.11,f),this.add(C(r,Math.abs(h),Math.abs(c)),o,t,u-Math.abs(h)/2,f)}return this}railing(t,e,i,n,s,r=1.05,o=E.steel,l=1.4){let c=Math.hypot(i-t,n-e),h=Math.max(2,Math.round(c/l)),d=(i-t)/h,u=(n-e)/h;this.add(C(c,.06,.06),o,(t+i)/2,s+r,(e+n)/2,[0,Math.atan2(i-t,n-e)+Math.PI/2,0]);for(let f=0;f<=h;f++)this.add(C(.05,r,.05),o,t+d*f,s+r/2,e+u*f);return this}ladder(t,e,i,n,s=0){let r=n-i,o=new Kt,l=new P,c=new P;this.add(C(.05,r,.05),E.steel,t-.25*Math.cos(s),i+r/2,e+.25*Math.sin(s)),this.add(C(.05,r,.05),E.steel,t+.25*Math.cos(s),i+r/2,e-.25*Math.sin(s));for(let h=i+.3;h<n;h+=.35)this.add(C(.5,.04,.05),E.steel,t,h,e);return this}finalize(){let t=0;for(let{mat:e,geoms:i}of this.buckets.values()){if(!i.length)continue;let n=i.length===1?i[0]:Un(i,!1);if(!n){console.warn("merge failed for",e.name);continue}n.computeBoundingSphere();let s=new At(n,e);s.castShadow=this.castShadow&&!e.userData.noShadow,s.receiveShadow=this.receiveShadow,s.matrixAutoUpdate=!1,s.updateMatrix(),this.group.add(s),t++;for(let r of i)r.dispose()}return this.buckets.clear(),{meshes:t,tris:this.triCount,colliders:this.colliders}}dispose(){this.group.traverse(t=>{t.isMesh&&t.geometry.dispose()}),this.group.parent&&this.group.parent.remove(this.group)}};var Bt={bed(a,t,e,i,n=0,s){let l=[0,n,0];a.add(C(.95,.28,1.95),E.wood,t,e+.34,i,l),a.add(C(.95-.08,.16,1.95-.1),E.fabric,t,e+.55,i,l),a.add(C(.95,.09,1.95*.8),E.fabric,t,e+.63,i,l),a.add(C(.95,.85,.08),E.wood,t,e+.62,i-1.95/2*Math.cos(n),l);for(let c of[-1,1])for(let h of[-1,1])a.add(C(.07,.2,.07),E.wood,t+c*(.95/2-.08)*Math.cos(n)-h*(1.95/2-.1)*Math.sin(n),e+.1,i-c*(.95/2-.08)*Math.sin(n)-h*(1.95/2-.1)*Math.cos(n));a.collideBox(t-.95/2-.05,e,i-1.95/2-.05,t+.95/2+.05,e+.6,i+1.95/2+.05,"furniture")},bunkBed(a,t,e,i,n=0,s){for(let l=0;l<2;l++)a.add(C(.95,.1,2),E.steel,t,e+.42+l*1.1,i,[0,n,0]),a.add(C(.95-.06,.12,2-.15),E.fabric,t,e+.51+l*1.1,i,[0,n,0]);for(let l of[-1,1])for(let c of[-1,1])a.add(C(.06,2.1,.06),E.steel,t+l*(.95/2-.03),e+1.05,i+c*(2/2-.03));a.collideBox(t-.95/2,e,i-2/2,t+.95/2,e+1.9,i+2/2,"furniture")},table(a,t,e,i,n=0,s,r=1.3,o=.8){a.add(C(r,.06,o),E.wood,t,e+.74,i,[0,n,0]);for(let l of[-1,1])for(let c of[-1,1])a.add(C(.06,.73,.06),E.wood,t+l*(r/2-.08)*Math.cos(n)-c*(o/2-.08)*Math.sin(n),e+.365,i-l*(r/2-.08)*Math.sin(n)-c*(o/2-.08)*Math.cos(n));a.collideBox(t-r/2,e,i-o/2,t+r/2,e+.78,i+o/2,"furniture")},chair(a,t,e,i,n=0){a.add(C(.42,.05,.42),E.wood,t,e+.44,i,[0,n,0]),a.add(C(.42,.5,.05),E.wood,t,e+.72,i-.2*Math.cos(n),[0,n,0]);for(let s of[-1,1])for(let r of[-1,1])a.add(C(.04,.44,.04),E.wood,t+s*.17,e+.22,i+r*.17)},sofa(a,t,e,i,n=0){a.add(C(1.9,.4,.85),E.fabric,t,e+.24,i,[0,n,0]),a.add(C(1.9,.55,.2),E.fabric,t,e+.62,i-.32*Math.cos(n),[0,n,0]),a.add(C(.2,.5,.85),E.fabric,t-.86*Math.cos(n),e+.55,i+.86*Math.sin(n),[0,n,0]),a.add(C(.2,.5,.85),E.fabric,t+.86*Math.cos(n),e+.55,i-.86*Math.sin(n),[0,n,0]),a.collideBox(t-1,e,i-.45,t+1,e+.85,i+.45,"furniture")},cabinet(a,t,e,i,n=0,s=1.8,r=.9){a.add(C(r,s,.45),E.woodWeathered,t,e+s/2,i,[0,n,0]);for(let o=0;o<Math.floor(s/.45);o++)a.add(C(r-.06,.02,.02),E.steel,t,e+.4+o*.45,i+.23,[0,n,0]);a.collideBox(t-r/2,e,i-.25,t+r/2,e+s,i+.25,"furniture")},locker(a,t,e,i,n=0){a.box(t,e+.95,i,.45,1.9,.5,E.metalPaint,{collide:!1,rot:[0,n,0]}),a.add(C(.04,.02,.02),E.steel,t+.16,e+1,i+.26,[0,n,0]),a.collideBox(t-.25,e,i-.25,t+.25,e+1.9,i+.25,"furniture")},shelf(a,t,e,i,n=0,s=1.9,r=1.4,o=.4){a.add(C(.05,s,o),E.steel,t-r/2,e+s/2,i,[0,n,0]),a.add(C(.05,s,o),E.steel,t+r/2,e+s/2,i,[0,n,0]);let l=Math.floor(s/.45);for(let c=0;c<=l;c++)a.add(C(r,.04,o),E.steel,t,e+.1+c*.45,i,[0,n,0]);a.collideBox(t-r/2,e,i-o/2,t+r/2,e+s,i+o/2,"furniture")},desk(a,t,e,i,n=0){a.add(C(1.5,.06,.75),E.wood,t,e+.75,i,[0,n,0]),a.add(C(.5,.65,.7),E.wood,t-.45*Math.cos(n),e+.4,i+.45*Math.sin(n),[0,n,0]),a.collideBox(t-.75,e,i-.4,t+.75,e+.85,i+.4,"furniture")},counter(a,t,e,i,n=0,s=3){a.add(C(s,.95,.7),E.woodWeathered,t,e+.48,i,[0,n,0]),a.add(C(s+.1,.06,.82),E.tiles,t,e+.98,i,[0,n,0]),a.collideBox(t-s/2,e,i-.42,t+s/2,e+1,i+.42,"furniture")},hospitalBed(a,t,e,i,n=0){a.add(C(.95,.14,2),E.steel,t,e+.62,i,[0,n,0]),a.add(C(.85,.1,1.9),E.fabric,t,e+.74,i,[0,n,0]),a.add(C(.95,.5,.06),E.steel,t,e+.9,i-.95*Math.cos(n),[0,n,0]);for(let s of[-1,1])for(let r of[-1,1])a.add(C(.05,.55,.05),E.steel,t+s*.42,e+.28,i+r*.92);a.collideBox(t-.5,e,i-1.02,t+.5,e+.8,i+1.02,"furniture")},gurney(a,t,e,i,n=0){a.add(C(.7,.08,1.9),E.steel,t,e+.75,i,[0,n,0]);for(let s of[-1,1])for(let r of[-1,1])a.add(C(.04,.7,.04),E.steel,t+s*.3,e+.4,i+r*.85),a.add(rt(.07,.07,.05,6),E.woodWeathered,t+s*.3,e+.05,i+r*.85,[0,0,Math.PI/2])},toilet(a,t,e,i,n=0){a.add(C(.42,.4,.55),E.tiles,t,e+.2,i,[0,n,0]),a.add(C(.42,.12,.5),E.tiles,t,e+.46,i,[0,n,0]),a.add(C(.4,.5,.18),E.tiles,t,e+.5,i-.28*Math.cos(n),[0,n,0])},sink(a,t,e,i,n=0){a.add(C(.55,.18,.42),E.tiles,t,e+.82,i,[0,n,0]),a.add(C(.1,.8,.1),E.steel,t,e+.4,i,[0,n,0]),a.add(rt(.02,.02,.22,6),E.steel,t,e+.95,i+.12)},machine(a,t,e,i,n=0,s=1.6,r=1.3,o=.8){a.add(C(s,r,o),E.metalPaint,t,e+r/2,i,[0,n,0]),a.add(C(s*.5,.25,.05),E.hazard,t,e+r*.7,i+o/2+.01,[0,n,0]),a.add(rt(.12,.12,.4,8),E.steel,t+s*.3,e+r+.2,i,[0,n,0]),a.collideBox(t-s/2,e,i-o/2,t+s/2,e+r,i+o/2,"furniture")},crate(a,t,e,i,n=0,s=1){a.add(C(.9*s,.7*s,.9*s),E.wood,t,e+.35*s,i,[0,n,0]),a.add(C(.94*s,.06*s,.94*s),E.woodWeathered,t,e+.7*s,i,[0,n,0]),a.collideBox(t-.45*s,e,i-.45*s,t+.45*s,e+.72*s,i+.45*s,"prop")},barrel(a,t,e,i,n){let s=n?n.chance(.5):!0;a.add(rt(.29,.29,.88,14),s?E.rust:E.hazard,t,e+.44,i),a.add(rt(.3,.3,.04,14),E.steel,t,e+.88,i),a.add(rt(.3,.3,.04,14),E.steel,t,e+.02,i),a.collideBox(t-.3,e,i-.3,t+.3,e+.9,i+.3,"prop")},sandbagWall(a,t,e,i,n=0,s=3){let r=Math.round(s/.5);for(let o=0;o<3;o++)for(let l=0;l<r;l++){let c=o%2*.25;a.add(Je(.26,6),E.fabric,t-s/2+.25+l*.5+c,e+.14+o*.26,i,[0,0,0],{x:1.15,y:.55,z:.72})}a.collideBox(t-s/2,e,i-.25,t+s/2,e+.78,i+.25,"cover")},fireplace(a,t,e,i){a.add(C(1.4,.9,.5),E.brick,t,e+.45,i),a.add(C(1,.55,.1),E.brick,t,e+.62,i+.22),a.add(C(1.5,.12,.6),E.concrete,t,e+.95,i),a.collideBox(t-.7,e,i-.25,t+.7,e+1,i+.25,"furniture")},clock(a,t,e,i,n=0){a.add(rt(.22,.22,.06,16),E.wood,t,e+2.3,i,[Math.PI/2,0,n]),a.add(rt(.19,.19,.02,16),E.paper,t,e+2.3,i+.03,[Math.PI/2,0,n])}},md={sedan:{l:4.4,w:1.8,h:.62,cabin:1.3,color:[7167826,4871520,6974046,8211002]},van:{l:5,w:2,h:.85,cabin:2.6,color:[9078136,5923416]},pickup:{l:5.2,w:1.95,h:.75,cabin:1.6,color:[8022602,5529679]},bus:{l:10.5,w:2.5,h:1.5,cabin:8.5,color:[9075258,6978170]},truck:{l:7,w:2.3,h:1.1,cabin:2.2,color:[5200452,5918784]},military:{l:6.6,w:2.3,h:1,cabin:2.4,color:[4871232,5660230]}};function gd(a,t,e,i,n,s,r=null,o={}){let l=Object.keys(md),c=r||s.pick(l.slice(0,o.allTypes?l.length:3)),h=md[c],d=new mt(s.pick(h.color)),u=vt("metal_paint",{color:d.getHex()}),f=o.burned??s.chance(.25),g=f?vt("rust",{color:6974056}):u,y=[0,n,0],p=Math.cos(n),m=Math.sin(n),x=h.l,v=h.w,b=h.h,_=o.wrecked?-.12:0;a.add(C(v,b,x),g,t,e+.5+_,i,y),a.add(C(v-.12,b*.95,h.cabin),g,t-m*.2,e+.5+b*.9+_,i-p*.2,y);let A=ye(2371635,{roughness:.3,metalness:.4,transparent:!0,opacity:f?.5:.75});f||(a.add(C(v-.2,b*.55,.04),A,t-m*.2+m*(h.cabin/2),e+.5+b*1.05+_,i-p*.2+p*(h.cabin/2)),a.add(C(v-.2,b*.55,.04),A,t-m*.2-m*(h.cabin/2),e+.5+b*1.05+_,i-p*.2-p*(h.cabin/2)),a.add(C(.04,b*.5,h.cabin*.8),A,t+p*(v/2-.1),e+.5+b*1.05+_,i-m*(v/2-.1),y),a.add(C(.04,b*.5,h.cabin*.8),A,t-p*(v/2-.1),e+.5+b*1.05+_,i+m*(v/2-.1),y));let T=ye(1710616,{roughness:.95}),k=x*.32;for(let D of[-1,1])for(let w of[-1,1]){let M=t+p*D*(v/2-.05)+m*w*k,L=i-m*D*(v/2-.05)+p*w*k;s.chance(f?.4:.12)||(a.add(rt(.34,.34,.24,12),T,M,e+.34,L,[0,n,Math.PI/2]),a.add(rt(.18,.18,.26,8),E.steel,M,e+.34,L,[0,n,Math.PI/2]))}return a.add(C(v+.06,.16,.14),E.steel,t+m*(x/2),e+.42+_,i+p*(x/2),y),f||(a.add(C(.3,.14,.06),ye(11577488,{roughness:.4}),t+p*(v/2-.4)+m*(x/2),e+.72+_,i-m*(v/2-.4)+p*(x/2),y),a.add(C(.3,.14,.06),ye(11577488,{roughness:.4}),t-p*(v/2-.4)+m*(x/2),e+.72+_,i+m*(v/2-.4)+p*(x/2),y)),s.chance(.4)&&a.add(C(v*.8,.08,h.cabin*.7),E.rust,t-m*.2,e+.5+b*1.9+_,i-p*.2,y),a.collideBox(t-Math.abs(p)*v/2-Math.abs(m)*x/2,e,i-Math.abs(m)*v/2-Math.abs(p)*x/2,t+Math.abs(p)*v/2+Math.abs(m)*x/2,e+1.6,i+Math.abs(m)*v/2+Math.abs(p)*x/2,"vehicle"),{type:c,pos:[t,e,i]}}function yd(){let a=[],t=new Pt(4242);for(let e=0;e<3;e++){let i=[],n=9+e*2.2,s=new ii(.16+e*.03,.34+e*.05,n*.62,8,3),r=s.attributes.position;for(let h=0;h<r.count;h++){let d=r.getY(h)+n*.31;r.setX(h,r.getX(h)+Math.sin(d*.6+e)*.14*(d/n))}s.translate(0,n*.31,0),s.deleteAttribute("uv"),s.setAttribute("uv",new ii(.16,.34,n*.62,8,3).attributes.uv),i.push(s);for(let h=0;h<4;h++){let d=new ii(.04,.09,1.6,5),u=h/4*Math.PI*2+e;d.rotateZ(Math.PI/3.2),d.rotateY(u),d.translate(Math.cos(u)*.7,n*.55+h*.35,Math.sin(u)*.7),i.push(d)}let o=$s(i),l=[],c=4+e;for(let h=0;h<c;h++){let d=n*.42+h/c*n*.55,u=(1-h/c)*2.1+.5;for(let g=0;g<3;g++){let y=g/3*Math.PI*2+h*1.7,p=new ze(u*2.1,u*1.5);p.rotateY(y),p.translate(0,d,0),l.push(p)}let f=new ze(u*2.4,u*2.4);f.rotateX(-Math.PI/2),f.translate(0,d-.3,0),l.push(f)}a.push({kind:"pine",trunk:o,foliage:$s(l),height:n,radius:.4})}for(let e=0;e<2;e++){let i=11+e*3,n=[],s=new ii(.13,.22,i*.8,8,3),r=s.attributes.position;for(let l=0;l<r.count;l++){let c=r.getY(l)+i*.4;r.setX(l,r.getX(l)+Math.sin(c*.4+e*3)*.3*(c/i))}s.translate(0,i*.4,0),n.push(s);let o=[];for(let l=0;l<7;l++){let c=t.range(0,Math.PI*2),h=t.range(1.2,2.6),d=new ze(t.range(2.4,4),t.range(2,3.2));d.rotateY(c),d.rotateX(t.range(-.3,.3)),d.translate(Math.cos(c)*h*.5,i*.7+t.range(-1.2,2.2),Math.sin(c)*h*.5),o.push(d)}a.push({kind:"birch",trunk:$s(n),foliage:$s(o),height:i,radius:.25})}for(let e=0;e<2;e++){let i=7+e*3,n=[],s=new ii(.1,.3,i,7,4),r=s.attributes.position;for(let o=0;o<r.count;o++){let l=r.getY(o)+i/2;r.setX(o,r.getX(o)+Math.sin(l*.5+e)*.4*(l/i))}s.translate(0,i/2,0),n.push(s);for(let o=0;o<6;o++){let l=new ii(.03,.09,t.range(1.2,2.4),4);l.rotateZ(t.range(.7,1.3)),l.rotateY(t.range(0,Math.PI*2)),l.translate(0,t.range(i*.4,i*.85),0),n.push(l)}a.push({kind:"dead",trunk:$s(n),foliage:null,height:i,radius:.3})}for(let e of a)e.trunk&&e.trunk.computeVertexNormals(),e.foliage&&e.foliage.computeVertexNormals();return a}function $s(a){let{mergeGeometries:t}=zg(),e=a.map(i=>{let n=i.index?i.toNonIndexed():i;for(let s of Object.keys(n.attributes))["position","normal","uv"].includes(s)||n.deleteAttribute(s);if(!n.attributes.uv){let s=n.attributes.position.count;n.setAttribute("uv",new de(new Float32Array(s*2),2))}return n});return t(e,!1)}var gc=null;function zg(){return gc||(gc={mergeGeometries:Un}),gc}function Ys(a=1,t=1){let e=new la(1,t),i=new class{},n=e.attributes.position,s=new Pt(a),r=s.range(0,100),o=s.range(0,100);for(let c=0;c<n.count;c++){let h=n.getX(c),d=n.getY(c),u=n.getZ(c),g=.72+Math.sin(h*3.1+r)*Math.cos(d*2.7+o)*Math.sin(u*3.4+r*.5)*.28;n.setXYZ(c,h*g,d*g*.75,u*g)}e.computeVertexNormals();let l=e.attributes.uv;for(let c=0;c<l.count;c++)l.setXY(c,l.getX(c)*2,l.getY(c)*2);return e}var Qe={lampPost(a,t,e,i,n=!1){a.add(rt(.08,.12,6.2,8),E.steel,t,e+3.1,i),a.add(C(1.4,.1,.1),E.steel,t+Math.cos(0)*.7,e+6.1,i),n||a.add(C(.5,.18,.3),E.metalPaint,t+1.2,e+6,i),a.collideBox(t-.15,e,i-.15,t+.15,e+6.2,i+.15,"pole")},powerPole(a,t,e,i,n=0){a.add(rt(.13,.18,8.5,7),E.woodWeathered,t,e+4.25,i,[0,n,0]),a.add(C(2.2,.12,.12),E.woodWeathered,t,e+7.6,i,[0,n,0]);for(let s of[-1,1])a.add(C(.1,.22,.1),E.tiles,t+s*.9*Math.cos(n),e+7.78,i-s*.9*Math.sin(n));a.collideBox(t-.2,e,i-.2,t+.2,e+8.5,i+.2,"pole")},fence(a,t,e,i,n,s,r=2,o="chain"){let l=Math.hypot(i-t,n-e),c=Math.max(2,Math.round(l/2.4)),h=Math.atan2(i-t,n-e);for(let d=0;d<=c;d++){let u=d/c,f=Rt(t,i,u),g=Rt(e,n,u),y=s+0;o==="chain"?a.add(rt(.045,.05,r,5),E.steel,f,y+r/2,g):a.add(C(.1,r,.1),E.woodWeathered,f,y+r/2,g)}if(o==="chain")for(let d=0;d<c;d++){let u=d/c,f=(d+1)/c,g=Rt(t,i,(u+f)/2),y=Rt(e,n,(u+f)/2),p=l/c;a.add(C(.02,r-.2,p),ye(6974054,{transparent:!0,opacity:.45,roughness:.6,metalness:.5,side:_e,depthWrite:!1}),g,s+r/2,y,[0,h,0])}else for(let d=1;d<4;d++)a.add(C(.05,.1,l),E.woodWeathered,Rt(t,i,.5),s+r/3.4*d,Rt(e,n,.5),[0,h,0]);a.collideBox(Math.min(t,i)-.1,s,Math.min(e,n)-.1,Math.max(t,i)+.1,s+r,Math.max(e,n)+.1,"fence")},rubblePile(a,t,e,i,n,s=1.8){let r=Math.round(s*7);for(let o=0;o<r;o++){let l=n.range(0,Math.PI*2),c=n.range(0,s),h=n.range(.15,.7);a.add(C(h,h*n.range(.4,1),h*n.range(.6,1.4)),n.chance(.6)?E.concrete:E.brick,t+Math.cos(l)*c,e+h*.3,i+Math.sin(l)*c,[n.range(0,.5),n.range(0,6.28),n.range(0,.5)])}},trafficCone(a,t,e,i){a.add(C(.36,.04,.36),E.hazard,t,e+.02,i),a.add(rt(.02,.15,.6,8),ye(12870702,{roughness:.85}),t,e+.32,i)},jersey(a,t,e,i,n=0,s=3){a.add(C(s,.3,.5),E.concrete,t,e+.15,i,[0,n,0]),a.add(C(s-.2,.5,.32),E.concrete,t,e+.55,i,[0,n,0]),a.collideBox(t-s/2,e,i-.3,t+s/2,e+.85,i+.3,"cover")},generator(a,t,e,i,n=0){a.add(C(1.7,1,.9),E.metalPaint,t,e+.5,i,[0,n,0]),a.add(rt(.08,.08,.9,6),E.rust,t+.6,e+1.2,i),a.add(C(.5,.35,.05),E.hazard,t-.3,e+.6,i+.47,[0,n,0]),a.collideBox(t-.9,e,i-.5,t+.9,e+1.1,i+.5,"prop")},radioTower(a,t,e,i,n=14,s){for(let o=0;o<5;o++){let l=e+n/5*o,c=e+n/5*(o+1),h=Rt(.9,.2,o/5),d=Rt(.9,.2,(o+1)/5);for(let u=0;u<3;u++){let f=u/3*Math.PI*2,g=t+Math.cos(f)*h,y=i+Math.sin(f)*h,p=t+Math.cos(f)*d,m=i+Math.sin(f)*d,x=(g+p)/2,v=(y+m)/2,b=Math.hypot(p-g,m-y,c-l),_=Math.atan2(m-y,p-g);a.add(C(.08,b,.08),E.steel,x,(l+c)/2,v,[0,0,0]),a.add(C(.05,b*.98,.05),E.steel,(x+t)/2,(l+c)/2,(v+i)/2)}a.add(C(h*2,.08,h*2),E.steel,t,c,i)}a.add(rt(.05,.05,2.4,5),E.steel,t,e+n+1.2,i),a.collideBox(t-1,e,i-1,t+1,e+n,i+1,"pole")},watchtower(a,t,e,i,n=6){for(let s of[-1,1])for(let r of[-1,1])a.add(C(.16,n,.16),E.woodWeathered,t+s*1.4,e+n/2,i+r*1.4);a.add(C(3.2,.2,3.2),E.wood,t,e+n,i),a.add(C(3,.9,3),E.woodWeathered,t,e+n+.45,i),a.add(C(3.2,.15,3.2),E.corrugated,t,e+n+2.1,i),a.add(C(3,.35,.1),E.wood,t,e+n+1.5,i+1.5);for(let s of[-1,1])a.add(C(.1,.35,3),E.wood,t+s*1.5,e+n+1.5,i);a.collideBox(t-1.6,e,i-1.6,t+1.6,e+n+2.2,i+1.6,"tower")},barbedWire(a,t,e,i,n,s){let r=Math.hypot(i-t,n-e),o=Math.atan2(i-t,n-e);for(let l=0;l<3;l++)a.add(C(.03,.03,r),E.rust,(t+i)/2,s+.8+l*.35,(e+n)/2,[0,o,0])},pipes(a,t,e,i,n=0,s=6){for(let r=0;r<3;r++)a.add(rt(.18,.18,s,8),E.rust,t,e+.6+r*.45,i,[0,n,Math.PI/2]);for(let r=0;r<2;r++)a.add(C(.15,1.6,.15),E.steel,t+(s/2-.6)*(r?1:-1)*Math.cos(n),e+.8,i-(s/2-.6)*(r?1:-1)*Math.sin(n));a.collideBox(t-s/2,e,i-.5,t+s/2,e+1.2,i+.5,"prop")},pipesVertical(a,t,e,i,n=8){for(let s=0;s<2;s++)for(let r=0;r<2;r++)a.add(rt(.16,.16,n,8),E.rust,t+s*.42,e+n/2,i+r*.42);for(let s=1;s<4;s++)a.add(C(.5,.12,.12),E.steel,t+.21,e+s*2,i+.21,[Math.PI/2,0,0]);a.collideBox(t-.2,e,i-.2,t+.7,e+n,i+.7,"pipe")}};function yc(a,t){let e=new Kt,i=(n,s,r,o,l,c=0)=>{let h=new At(n,s);return h.position.set(r,o,l),h.rotation.y=c,h.castShadow=!0,h.receiveShadow=!0,e.add(h),h};if(a==="crate")i(C(.8,.62,.8),E.wood,0,.31,0),i(C(.84,.05,.84),E.woodWeathered,0,.63,0);else if(a==="cabinet")i(C(.7,1.6,.4),E.metalPaint,0,.8,0),i(C(.06,.02,.02),E.steel,.22,.9,.21);else if(a==="drawer")i(C(.9,.5,.6),E.woodWeathered,0,.25,0),i(C(.85,.06,.55),E.steel,0,.42,0);else if(a==="toolbox")i(C(.6,.3,.35),E.rust,0,.15,0),i(C(.5,.05,.05),E.steel,0,.34,0);else if(a==="body"){let n=i(C(.42,.28,.85),E.fabric,0,.14,0,t.range(0,6.28));i(Je(.14,8),E.flesh,.1,.16,-.5);for(let s of[-1,1])i(C(.13,.13,.55),E.fabric,s*.25,.1,.1,t.range(-.4,.4))}else a==="medbox"?(i(C(.5,.2,.35),E.paper,0,.1,0),i(C(.14,.03,.03),ye(10697258),0,.22,0)):a==="cash"?(i(C(.5,.45,.5),E.steel,0,.22,0),i(C(.46,.02,.46),E.panel,0,.46,0)):a==="stash"?(i(C(1,.7,.7),E.woodWeathered,0,.35,0),i(C(1.02,.08,.72),E.rust,0,.72,0),i(C(.1,.25,.05),E.steel,.4,.55,.36)):i(C(.5,.4,.5),E.wood,0,.2,0);return e.userData.kind=a,e}var Hi=.5,xc={house:{size:[8,12,7,9],floors:[1,2],floorH:2.9,style:"suburban",wall:()=>E.brickGrey,innerWall:()=>E.panel,floorMat:()=>E.floor,ext:.28,int:.14,roof:"gable",roomW:{living:26,kitchen:18,bedroom:26,bath:12,storage:10,hall:8},window:{sill:.95,h:1.15,w:1.2,spacing:3.4},loot:"house",lights:2},ruined_house:{size:[9,13,7,10],floors:[1,2],floorH:2.9,style:"suburban",wall:()=>E.brickGrey,innerWall:()=>E.panel,floorMat:()=>E.boardFloor?E.boardFloor:E.floor,ext:.3,int:.14,roof:"collapsed",roomW:{living:24,kitchen:16,bedroom:22,bath:10,storage:14,hall:8},window:{sill:.95,h:1.15,w:1.2,spacing:3.2},loot:"house",lights:1,ruin:.35},shop:{size:[10,18,9,14],floors:[1,1],floorH:3.6,style:"commercial",wall:()=>E.brick,innerWall:()=>E.panel,floorMat:()=>E.tiles,ext:.3,int:.16,roof:"flat",roomW:{sales:45,storage:30,back:15,bath:10},window:{sill:.7,h:2,w:2.2,spacing:4},loot:"store",lights:3},warehouse:{size:[16,30,14,24],floors:[1,2],floorH:5.2,style:"industrial",wall:()=>E.corrugated,innerWall:()=>E.brickGrey,floorMat:()=>E.floor,ext:.26,int:.18,roof:"flat",roomW:{hall:55,office:20,storage:25},window:{sill:3,h:1.2,w:1.6,spacing:5},loot:"industrial",lights:4},apartment:{size:[14,24,11,16],floors:[3,5],floorH:3,style:"urban",wall:()=>E.brick,innerWall:()=>E.panel,floorMat:()=>E.floor,ext:.32,int:.14,roof:"flat",roomW:{living:28,kitchen:16,bedroom:24,bath:12,corridor:20},window:{sill:1,h:1.3,w:1.3,spacing:3.2},loot:"house",lights:3},hospital:{size:[22,40,14,22],floors:[2,3],floorH:3.4,style:"institutional",wall:()=>E.tiles,innerWall:()=>E.tiles,floorMat:()=>E.tiles,ext:.32,int:.16,roof:"flat",roomW:{reception:22,waiting:16,patient:30,operating:12,storage:12,office:8},window:{sill:1.1,h:1.2,w:1.2,spacing:3.6},loot:"medical",lights:5},bunker:{size:[14,22,12,18],floors:[1,1],floorH:3.2,style:"bunker",wall:()=>E.concreteWet,innerWall:()=>E.concreteWet,floorMat:()=>E.floor,ext:.45,int:.22,roof:"flat",underground:!0,roomW:{corridor:24,control:20,armory:14,lab:14,generator:12,quarters:16},window:{sill:2.6,h:.4,w:.5,spacing:8},loot:"military",lights:4},factory:{size:[24,44,20,34],floors:[1,2],floorH:6.4,style:"industrial",wall:()=>E.corrugated,innerWall:()=>E.brickGrey,floorMat:()=>E.concrete_floor,ext:.3,int:.2,roof:"sawtooth",roomW:{hall:55,office:18,control:12,storage:15},window:{sill:3.6,h:1.4,w:2,spacing:5.4},loot:"industrial",lights:5},church:{size:[12,22,9,16],floors:[1,2],floorH:4.6,style:"gothic",wall:()=>E.brick,innerWall:()=>E.brick,floorMat:()=>E.floor,ext:.4,int:.24,roof:"gable_tall",roomW:{nave:60,altar:20,storage:10,corridor:10},window:{sill:1.8,h:2.6,w:.9,spacing:4.2},loot:"rare",lights:3},checkpoint:{size:[7,11,5,8],floors:[1,1],floorH:2.8,style:"military",wall:()=>E.concrete,innerWall:()=>E.concrete,floorMat:()=>E.floor,ext:.3,int:.16,roof:"flat",roomW:{corridor:40,office:40,storage:20},window:{sill:1.2,h:1,w:1.4,spacing:3},loot:"military",lights:2},office:{size:[12,20,10,16],floors:[2,4],floorH:3.2,style:"commercial",wall:()=>E.concrete,innerWall:()=>E.panel,floorMat:()=>E.floor,ext:.3,int:.14,roof:"flat",roomW:{office:45,corridor:30,storage:15,bath:10},window:{sill:.9,h:1.8,w:1.8,spacing:3.4},loot:"industrial",lights:3},gas_station:{size:[9,14,8,12],floors:[1,1],floorH:3.4,style:"commercial",wall:()=>E.concrete,innerWall:()=>E.panel,floorMat:()=>E.tiles,ext:.3,int:.15,roof:"flat",roomW:{sales:55,storage:25,bath:20},window:{sill:.8,h:1.6,w:2.4,spacing:3.6},loot:"store",lights:2},school:{size:[18,34,13,20],floors:[2,3],floorH:3.6,style:"institutional",wall:()=>E.brick,innerWall:()=>E.panel,floorMat:()=>E.floor,ext:.32,int:.16,roof:"flat",roomW:{office:22,corridor:26,storage:14,hall:38},window:{sill:1,h:1.5,w:1.6,spacing:3.6},loot:"house",lights:4},lab:{size:[16,26,13,20],floors:[2,3],floorH:3.4,style:"institutional",wall:()=>E.tiles,innerWall:()=>E.tiles,floorMat:()=>E.tiles,ext:.34,int:.18,roof:"flat",roomW:{lab:40,office:18,storage:20,patient:22},window:{sill:1.2,h:1.4,w:1.2,spacing:3.8},loot:"warden",lights:4}},xd={living:[["sofa",18],["table",12],["chair",12],["cabinet",10],["fireplace",8],["shelf",8],["clock",6],["bed",4]],kitchen:[["counter",22],["cabinet",18],["sink",12],["table",12],["chair",12],["shelf",8],["crate",6]],bedroom:[["bed",40],["cabinet",16],["chair",10],["shelf",10],["desk",8]],bath:[["toilet",30],["sink",26],["cabinet",18],["locker",10]],storage:[["shelf",30],["crate",22],["cabinet",18],["barrel",12],["locker",8]],hall:[["cabinet",26],["shelf",22],["crate",16],["desk",12]],corridor:[["locker",22],["shelf",14],["cabinet",10]],sales:[["counter",26],["shelf",26],["crate",12],["cabinet",10],["desk",8]],back:[["desk",24],["chair",20],["cabinet",18],["shelf",12]],office:[["desk",30],["chair",24],["cabinet",18],["shelf",12],["locker",10]],hall_big:[["shelf",26],["crate",22],["machine",16],["barrel",16],["counter",10]],operating:[["gurney",30],["machine",24],["shelf",16],["hospitalBed",12],["cabinet",12]],patient:[["hospitalBed",40],["cabinet",18],["chair",10],["gurney",8],["sink",8]],reception:[["counter",30],["desk",20],["chair",18],["cabinet",12],["sofa",10]],waiting:[["chair",30],["sofa",20],["table",12],["counter",8]],control:[["desk",30],["machine",26],["chair",18],["cabinet",12],["shelf",8]],armory:[["locker",34],["shelf",30],["crate",18],["cabinet",10]],lab:[["machine",30],["desk",22],["shelf",16],["cabinet",12],["gurney",10]],generator:[["generator",0],["barrel",30],["machine",24],["crate",16]],quarters:[["bunkBed",40],["locker",22],["cabinet",14],["desk",10]],nave:[["chair",70],["shelf",10],["table",10]],altar:[["table",30],["cabinet",24],["shelf",16]]};function vd(a,t){let e=0;for(let[,n]of t)e+=n;let i=a.next()*e;for(let[n,s]of t)if(i-=s,i<=0)return n;return t[0][0]}var js=class{constructor(t){Object.assign(this,{styleName:"house",seed:1,x:0,z:0,ry:0,y:null,floors:null,w:null,d:null,noRoof:!1,noLoot:!1,lootMul:1,lightMul:1,ruin:null,interiorOnly:!1,name:""},t),this.cfg=xc[this.styleName]||xc.house,this.rng=new Pt(this.seed),this.rooms=[],this.doors=[],this.lootPoints=[],this.lightPoints=[],this.propPoints=[],this.plane=[],this.stairs=[],this.entrance=null}build(t,e=0){let{rng:i,cfg:n}=this,s=this.w??i.range(n.size[0],n.size[1]),r=this.d??i.range(n.size[2],n.size[3]),o=this.floors??i.int(n.floors[0],n.floors[1]),l=n.floorH,c=this.y??e;this.w=s,this.d=r,this.floors=o,this.floorH=l,this.baseY=c,this.ruinChance=this.ruin??n.ruin??0;let h=Math.cos(this.ry),d=Math.sin(this.ry),u=(f,g)=>[this.x+f*h-g*d,this.z+f*d+g*h];this.entranceSide=i.pick(["front","front","left","right"]);for(let f=0;f<o;f++){let g=c+f*l,y=this.subdivide(s,r,f),p=this.rasterize(y,s,r);this.assignRoomTypes(y,f),this.buildFloorStructure(t,this.rooms.filter(m=>m.floor===f),p,s,r,g,f===o-1),this.populateRooms(t,this.rooms.filter(m=>m.floor===f),g,u),f<o-1&&this.buildStairs(t,this.rooms.filter(m=>m.floor===f),g,l),this.validateConnectivity(y,p,f)}return this.noRoof||this.buildRoof(t,s,r,c+o*l),this.dressExterior(t,s,r,c,u),this}subdivide(t,e,i){let{rng:n,cfg:s}=this,r=s.ext/2,o=[{x0:r,z0:r,x1:t-r,z1:e-r}],l=this.roomsPerFloor(),c=0;for(;o.length<l&&c++<40;){o.sort((x,v)=>(v.x1-v.x0)*(v.z1-v.z0)-(x.x1-x.x0)*(x.z1-x.z0));let h=o.shift(),d=h.x1-h.x0,u=h.z1-h.z0,f=2.6,g=2.4,y;d/f>u/g?y="x":u/g>d/f?y="z":y=d>u?"x":"z";let p=.36,m=.64;if(y==="x"){if(d<f*2){o.push(h);break}let x=h.x0+d*n.range(p,m);o.push({x0:h.x0,z0:h.z0,x1:x,z1:h.z1},{x0:x,z0:h.z0,x1:h.x1,z1:h.z1})}else{if(u<g*2){o.push(h);break}let x=h.z0+u*n.range(p,m);o.push({x0:h.x0,z0:h.z0,x1:h.x1,z1:x},{x0:h.x0,z0:x,x1:h.x1,z1:h.z1})}}return o.map((h,d)=>({...h,id:i*100+d,floor:i}))}roomsPerFloor(){let{cfg:t,rng:e}=this;switch(this.styleName){case"apartment":return e.int(4,6);case"hospital":return e.int(6,9);case"bunker":return e.int(5,7);case"factory":return e.int(4,6);case"warehouse":return e.int(3,5);case"church":return e.int(3,4);case"shop":case"gas_station":return e.int(3,4);case"school":return e.int(5,7);case"lab":return e.int(4,6);default:return e.int(4,6)}}assignRoomTypes(t,e){let{rng:i,cfg:n}=this,s=Object.entries(n.roomW);for(let r of t){let o=vd(i,s);this.rooms.push({...r,type:o,floor:e,area:(r.x1-r.x0)*(r.z1-r.z0)})}}rasterize(t,e,i){let n=Math.ceil(e/Hi),s=Math.ceil(i/Hi),r=new Int16Array(n*s).fill(-1);for(let o=0;o<s;o++)for(let l=0;l<n;l++){let c=(l+.5)*Hi,h=(o+.5)*Hi;for(let d of t)if(c>=d.x0&&c<=d.x1&&h>=d.z0&&h<=d.z1){r[o*n+l]=d.id;break}}return{grid:r,nx:n,nz:s,w:e,d:i}}buildFloorStructure(t,e,i,n,s,r,o){let{cfg:l,rng:c}=this,h=Math.cos(this.ry),d=Math.sin(this.ry),u=l.floorMat();this.slabQuads(t,n,s,r,u,.22),o?l.roof==="flat"&&this.slabQuads(t,n,s,r+this.floorH,E.concrete,.3):this.slabQuads(t,n,s,r+this.floorH,E.concrete,.24);let f=this.floorH-.24,g=m=>m===-1,y=(m,x)=>m<0||x<0||m>=i.nx||x>=i.nz?-2:i.grid[x*i.nx+m],p=[];for(let m=0;m<=i.nx;m++){let x=null;for(let v=0;v<=i.nz;v++){let b=!1,_=-9,A=-9;if(v<i.nz&&m>0&&m<i.nx){let T=y(m-1,v),k=y(m,v);T!==k&&T!==-2&&k!==-2&&(b=!0,_=T,A=k)}else if(v<i.nz&&(m===0||m===i.nx)){let T=y(m===0?0:i.nx-1,v);T>=0&&(b=!0,_=T,A=-1)}b&&x===null?x={j0:v,left:_,right:A}:(!b||x&&(x.left!==_||x.right!==A))&&x&&(p.push({axis:"z",at:m*Hi,a0:x.j0*Hi,a1:v*Hi,left:x.left,right:x.right}),x=b?{j0:v,left:_,right:A}:null)}}for(let m=0;m<=i.nz;m++){let x=null;for(let v=0;v<=i.nx;v++){let b=!1,_=-9,A=-9;if(v<i.nx&&m>0&&m<i.nz){let T=y(v,m-1),k=y(v,m);T!==k&&T!==-2&&k!==-2&&(b=!0,_=T,A=k)}else if(v<i.nx&&(m===0||m===i.nz)){let T=y(v,m===0?0:i.nz-1);T>=0&&(b=!0,_=T,A=-1)}b&&x===null?x={i0:v,left:_,right:A}:(!b||x&&(x.left!==_||x.right!==A))&&x&&(p.push({axis:"x",at:m*Hi,a0:x.i0*Hi,a1:v*Hi,left:x.left,right:x.right}),x=b?{i0:v,left:_,right:A}:null)}}for(let m of p){let x=m.a1-m.a0;if(x<.4)continue;let v=m.right===-1||m.left===-1,b=v?l.ext:l.int,_=v?l.wall():l.innerWall(),A=[],T=this.isEntranceWall(m,n,s),k=[];if(v){let D=l.window,w=Math.max(0,Math.floor((x-1)/D.spacing));for(let M=0;M<w;M++){let L=m.a0+x/(w+1)*(M+1),U=Math.min(D.w/2,.9);k.push({c:L,w:U*2,kind:"window",sill:D.sill,top:D.sill+D.h})}T&&(k.push({c:m.a0+x/2,w:1.3,kind:"door",sill:0,top:2.25}),this.entrance={axis:m.axis,at:m.at,a0:m.a0+x/2,floor:0})}else if(x>1.8){let D=x>6?2:1;for(let w=0;w<D;w++){let M=m.a0+x/(D+1)*(w+1);k.push({c:M,w:1.1,kind:"doorway",sill:0,top:2.15})}}for(let D of k)A.push({x0:D.c-D.w/2,x1:D.c+D.w/2,y0:r+D.sill,y1:r+D.top});if(m.axis==="z"){this.wallLocalZ(t,m.at,m.a0,m.a1,r,r+f,b,_,A);for(let D of k)this.addOpeningDressing(t,D,"z",m.at,r,b,m.a0)}else{this.wallLocalX(t,m.at,m.a0,m.a1,r,r+f,b,_,A);for(let D of k)this.addOpeningDressing(t,D,"x",m.at,r,b,m.a0)}for(let D of k){if(D.kind!=="doorway"||this.rng.chance(.42))continue;let[w,M]=this.localToWorld(m.axis==="z"?m.at:D.c,m.axis==="z"?D.c:m.at),L=m.axis==="z"?this.ry+Math.PI/2:this.ry;this.doors.push({x:w,y:r,z:M,ry:L,w:D.w-.06,h:2.1,kind:this.rng.chance(.3)?"metal":"wood",swing:this.rng.chance(.5)?1:-1,startOpen:this.rng.chance(.35)?this.rng.range(.6,1.5):0})}if(v&&k.some(D=>D.kind==="door")){let D=k.find(L=>L.kind==="door"),[w,M]=this.localToWorld(m.axis==="z"?m.at:D.c,m.axis==="z"?D.c:m.at);this.doors.push({x:w,y:r,z:M,ry:m.axis==="z"?this.ry+Math.PI/2:this.ry,w:D.w-.06,h:2.1,kind:"wood",swing:1,startOpen:this.rng.chance(.6)?1.4:0,exterior:!0})}}}isEntranceWall(t,e,i){if(t.right!==-1&&t.left!==-1)return!1;let n=this.entranceSide,s=1.2;if(t.axis==="x"){if(Math.abs(t.at-0)<s)return n==="front";if(Math.abs(t.at-i)<s)return n==="back"}else{if(Math.abs(t.at-0)<s)return n==="left";if(Math.abs(t.at-e)<s)return n==="right"}return!1}localToWorld(t,e){let i=Math.cos(this.ry),n=Math.sin(this.ry);return[this.x+t*i-e*n,this.z+t*n+e*i]}wallLocalZ(t,e,i,n,s,r,o,l,c){let[h,d]=this.localToWorld(e,i),[u,f]=this.localToWorld(e,n),g=(h+u)/2,y=(d+f)/2,p=Math.hypot(u-h,f-d),m=Math.atan2(u-h,f-d),x=this.splitHoles(0,p,s,r,c.map(v=>({x0:this.localZtoParam(v.x0,i,n,p),x1:this.localZtoParam(v.x1,i,n,p),y0:v.y0,y1:v.y1})));for(let v of x){let b=v.x1-v.x0,_=v.y1-v.y0;if(b<=.01||_<=.01)continue;let A=(v.x0+v.x1)/2/p,T=Rt(h,u,A),k=Rt(d,f,A);t.add(C(o,_,b),l,T,(v.y0+v.y1)/2,k,[0,m,0]);let D=Math.cos(m),w=Math.sin(m),M=o/2,L=b/2;t.collideBox(T-Math.abs(D)*M-Math.abs(w)*L,v.y0,k-Math.abs(w)*M-Math.abs(D)*L,T+Math.abs(D)*M+Math.abs(w)*L,v.y1,k+Math.abs(w)*M+Math.abs(D)*L,"wall")}}wallLocalX(t,e,i,n,s,r,o,l,c){let[h,d]=this.localToWorld(i,e),[u,f]=this.localToWorld(n,e),g=(h+u)/2,y=(d+f)/2,p=Math.hypot(u-h,f-d),m=Math.atan2(u-h,f-d),x=this.splitHoles(0,p,s,r,c.map(v=>({x0:this.localXtoParam(v.x0,i,n,p),x1:this.localXtoParam(v.x1,i,n,p),y0:v.y0,y1:v.y1})));for(let v of x){let b=v.x1-v.x0,_=v.y1-v.y0;if(b<=.01||_<=.01)continue;let A=(v.x0+v.x1)/2/p,T=Rt(h,u,A),k=Rt(d,f,A);t.add(C(b,_,o),l,T,(v.y0+v.y1)/2,k,[0,m,0]);let D=Math.cos(m),w=Math.sin(m),M=b/2,L=o/2;t.collideBox(T-Math.abs(D)*M-Math.abs(w)*L,v.y0,k-Math.abs(w)*M-Math.abs(D)*L,T+Math.abs(D)*M+Math.abs(w)*L,v.y1,k+Math.abs(w)*M+Math.abs(D)*L,"wall")}}localZtoParam(t,e,i,n){return(Math.abs(i-e)<1e-6?0:(t-e)/(i-e))*n}localXtoParam(t,e,i,n){return(Math.abs(i-e)<1e-6?0:(t-e)/(i-e))*n}splitHoles(t,e,i,n,s){let r=[],o=s.filter(c=>c.x1>t&&c.x0<e&&c.y1>i&&c.y0<n).map(c=>({x0:Math.max(t,c.x0),x1:Math.min(e,c.x1),y0:Math.max(i,c.y0),y1:Math.min(n,c.y1)})).sort((c,h)=>c.x0-h.x0),l=t;for(let c of o)c.x0>l&&r.push({x0:l,x1:c.x0,y0:i,y1:n}),c.y0>i&&r.push({x0:c.x0,x1:c.x1,y0:i,y1:c.y0}),c.y1<n&&r.push({x0:c.x0,x1:c.x1,y0:c.y1,y1:n}),l=Math.max(l,c.x1);return l<e&&r.push({x0:l,x1:e,y0:i,y1:n}),r}addOpeningDressing(t,e,i,n,s,r,o){let{rng:l}=this,c=l.chance(.45),h=i==="z"?n:e.c,d=i==="z"?e.c:n,[u,f]=this.localToWorld(h,d),g=i==="z"?this.ry+Math.PI/2:this.ry;if(e.kind==="window"){if(t.add(C(e.w+.06*2,.06,.1),E.woodWeathered,u,s+e.sill,f,[0,g,0]),t.add(C(e.w+.2,.06,.22),E.concrete,u,s+e.sill-.03,f,[0,g,0]),c)for(let p=0;p<3;p++)t.add(C(.1,.18,.02),ye(9347236,{transparent:!0,opacity:.4,roughness:.1}),u+l.range(-e.w/2,e.w/2)*Math.cos(g),s+e.top-.12,f-l.range(-e.w/2,e.w/2)*Math.sin(g),[0,g,l.range(-.3,.3)]);else{let p=ye(9347236,{roughness:.08,metalness:.1,transparent:!0,opacity:.32,depthWrite:!1});t.add(C(e.w,e.top-e.sill,.03),p,u,s+(e.sill+e.top)/2,f,[0,g,0])}e.w>1.6&&t.add(C(.05,e.top-e.sill,.08),E.woodWeathered,u,s+(e.sill+e.top)/2,f,[0,g,0])}else e.kind==="door"&&(t.add(C(e.w+.14,.08,.3),E.woodWeathered,u,s+e.top,f,[0,g,0]),t.add(C(.07,e.top,.3),E.woodWeathered,u+Math.cos(g)*(e.w/2),s+e.top/2,f-Math.sin(g)*(e.w/2),[0,g,0]),t.add(C(.07,e.top,.3),E.woodWeathered,u-Math.cos(g)*(e.w/2),s+e.top/2,f+Math.sin(g)*(e.w/2),[0,g,0]),t.add(C(e.w+.2,.12,.6),E.concrete,u,s-.06,f,[0,g,0]))}slabQuads(t,e,i,n,s,r){let o=Math.cos(this.ry),l=Math.sin(this.ry),[c,h]=this.localToWorld(e/2,i/2);t.add(C(e,r,i),s,c,n-r/2,h,[0,this.ry,0]);let d=e/2,u=i/2,f=Math.abs(o)*d+Math.abs(l)*u,g=Math.abs(l)*d+Math.abs(o)*u;t.collideBox(c-f,n-r,h-g,c+f,n,h+g,"floor")}buildStairs(t,e,i,n){let{rng:s}=this,r=e.filter(x=>x.z1-x.z0>4.5).sort((x,v)=>v.area-x.area);if(!r.length)return;let o=r[0],l=o.z0+.6,c=Math.min(o.z1-.6,l+(o.z1-o.z0)*.75),h=o.x0+(o.x1-o.x0)*.5,d=14,u=(c-l)/d,f=n/d,g=Math.min(1.5,o.x1-o.x0-.4),[y,p]=this.localToWorld(h,l),m=Math.sign(c-l);for(let x=0;x<d;x++){let v=i+f*(x+1),b=l+u*(x+.5),[_,A]=this.localToWorld(h,b);t.add(C(g,f+.03,Math.abs(u)+.02),E.concrete,_,v-f/2-.015,A,[0,this.ry,0]),t.collideBox(_-g/2,v-f,A-Math.abs(u)/2,_+g/2,v,A+Math.abs(u)/2,"stairs")}for(let x=0;x<d;x+=2){let v=l+u*(x+.5),[b,_]=this.localToWorld(h+g/2+.03,v);t.add(C(.04,1,.04),E.steel,b,i+n/d*(x+1)+.5,_)}this.stairs.push({x:y,z:p,y:i,dirZ:m,w:g,len:c-l})}populateRooms(t,e,i,n){let{rng:s,cfg:r}=this;for(let o of e){let l=o.x1-o.x0,c=o.z1-o.z0,h=l*c,d=xd[o.type]||xd.hall,u=Z(Math.round(h/7),1,6);for(let f=0;f<u;f++){let g=vd(s,d),y=.75,p=s.int(0,3),m,x,v;p===0?(m=o.x0+y,x=s.range(o.z0+y,o.z1-y),v=this.ry+Math.PI/2):p===1?(m=o.x1-y,x=s.range(o.z0+y,o.z1-y),v=this.ry-Math.PI/2):p===2?(m=s.range(o.x0+y,o.x1-y),x=o.z0+y,v=this.ry):(m=s.range(o.x0+y,o.x1-y),x=o.z1-y,v=this.ry+Math.PI);let[b,_]=this.localToWorld(m,x);this.placeFurniture(t,g,b,i,_,v,s,o)}if(!this.noLoot&&s.chance(.75*this.lootMul)){let[f,g]=this.localToWorld(s.range(o.x0+1,o.x1-1),s.range(o.z0+1,o.z1-1));this.lootPoints.push({x:f,y:i,z:g,table:this.lootTableFor(o.type),kind:s.pick(["crate","cabinet","drawer","toolbox","medbox","stash"])})}if(!this.noLoot&&s.chance(.3*this.lootMul)){let[f,g]=this.localToWorld(s.range(o.x0+.8,o.x1-.8),s.range(o.z0+.8,o.z1-.8));this.lootPoints.push({x:f,y:i+.8,z:g,table:s.chance(.5)?"house":this.lootTableFor(o.type),kind:"body"})}if(s.chance(.55*this.lightMul)){let[f,g]=this.localToWorld((o.x0+o.x1)/2,(o.z0+o.z1)/2);this.lightPoints.push({x:f,y:i+this.floorH-.35,z:g,flicker:s.chance(.55),color:s.chance(.25)?6738080:s.chance(.3)?13672544:14213328,intensity:s.range(2.2,5),range:s.range(5,9),dead:s.chance(.3)}),t.add(C(.9,.08,.25),E.steel,f,i+this.floorH-.12,g,[0,this.ry,0])}}}lootTableFor(t){switch(t){case"patient":case"operating":case"bath":return"medical";case"armory":case"control":return"military";case"generator":case"storage":case"hall_big":return"industrial";case"sales":case"kitchen":return"store";case"nave":case"altar":return"rare";case"lab":return"warden";case"office":case"reception":return"tool";default:return this.cfg.loot||"house"}}placeFurniture(t,e,i,n,s,r,o,l){switch(e){case"bed":Bt.bed(t,i,n,s,r,o);break;case"bunkBed":Bt.bunkBed(t,i,n,s,r,o);break;case"table":Bt.table(t,i,n,s,r,o);break;case"chair":Bt.chair(t,i,n,s,r);break;case"sofa":Bt.sofa(t,i,n,s,r);break;case"cabinet":Bt.cabinet(t,i,n,s,r,o.range(1.2,2));break;case"locker":Bt.locker(t,i,n,s,r);break;case"shelf":Bt.shelf(t,i,n,s,r);break;case"desk":Bt.desk(t,i,n,s,r);break;case"counter":Bt.counter(t,i,n,s,r,o.range(2,3.4));break;case"hospitalBed":Bt.hospitalBed(t,i,n,s,r);break;case"gurney":Bt.gurney(t,i,n,s,r);break;case"toilet":Bt.toilet(t,i,n,s,r);break;case"sink":Bt.sink(t,i,n,s,r);break;case"machine":Bt.machine(t,i,n,s,r,o.range(1,2),o.range(.9,1.6),o.range(.6,1));break;case"crate":Bt.crate(t,i,n,s,r,o.range(.8,1.1));break;case"barrel":Bt.barrel(t,i,n,s,o);break;case"generator":Qe.generator(t,i,n,s,r);break;case"fireplace":Bt.fireplace(t,i,n,s);break;case"clock":Bt.clock(t,i,n,s,r);break;default:Bt.cabinet(t,i,n,s,r)}}buildRoof(t,e,i,n){let{cfg:s,rng:r}=this,o=Math.cos(this.ry),l=Math.sin(this.ry);if(s.roof==="flat"){this.slabQuads(t,e+.4,i+.4,n+.32,E.concrete,.3);for(let[c,h,d,u]of[[0,-i/2,e+.4,.2],[0,i/2,e+.4,.2],[-e/2,0,.2,i+.4],[e/2,0,.2,i+.4]]){let[f,g]=this.localToWorld(e/2+c,i/2+h);t.add(C(d,.7,u),E.concrete,f,n+.65,g,[0,this.ry,0])}}else if(s.roof==="collapsed"){let c=e/2,h=1.2,[d,u]=this.localToWorld(e/2,i/2),f=Math.atan2(h,c);t.add(C(Math.hypot(c,h),.14,i),E.corrugated,d-c/2*o,n+h/2,u-c/2*l,[0,this.ry,0]);for(let g=0;g<5;g++){let[y,p]=this.localToWorld(e*.62+g*.7,i*(.2+g*.15));t.add(C(.12,.16,Math.min(4,i*.5)),E.woodWeathered,y,n+.25+g*.12,p,[.2,this.ry,0])}}else{let c=s.roof==="gable_tall"?4.2:1.9,h=e/2,d=Math.atan2(c,h);for(let g of[-1,1]){let[y,p]=this.localToWorld(e/2+g*h/2,i/2);t.add(C(Math.hypot(h,c)+.3,.16,i+.5),E.corrugated,y,n+c/2,p,[0,this.ry,-g*d])}let[u,f]=this.localToWorld(e/2,i/2);t.add(C(.16,.16,i+.6),E.rust,u,n+c,f,[0,this.ry,0]);for(let g of[-1,1]){let[y,p]=this.localToWorld(e/2,i/2+g*i/2),m=6;for(let x=0;x<m;x++){let v=c*(1-x/m),b=h*2*(1-x/m);t.add(C(b,c/m+.02,.16),s.wall(),y,n+(x+.5)*(c/m),p,[0,this.ry,0])}}}}dressExterior(t,e,i,n,s){let{rng:r}=this,[o,l]=this.localToWorld(e/2,i/2);t.add(C(e+.3,.5,i+.3),E.concrete,o,n-.3,l,[0,this.ry,0]);for(let[d,u]of[[0,0],[e,0],[0,i],[e,i]]){let[f,g]=this.localToWorld(d,u);t.add(C(.34,this.floors*this.floorH,.34),E.concreteWet,f,n+this.floors*this.floorH/2,g,[0,this.ry,0])}let[c,h]=this.localToWorld(e-.5,i/2);t.add(rt(.09,.09,this.floors*this.floorH,6),E.rust,c,n+this.floors*this.floorH/2,h);for(let d=0;d<2;d++){let[u,f]=this.localToWorld(r.range(1,e-1),r.range(1,i-1));t.add(C(.6,.7,.6),E.steel,u,n+this.floors*this.floorH+.9,f,[0,this.ry,0])}if(this.styleName==="warehouse"||this.styleName==="factory"){let[d,u]=this.localToWorld(e/2,-1.2);t.add(C(e*.4,1,2),E.concrete,d,n+.3,u,[0,this.ry,0])}}validateConnectivity(t,e,i){let n=new Map;for(let o of t)n.set(o.id,new Set);for(let o of t)for(let l of t){if(o.id===l.id)continue;let c=Math.min(o.x1,l.x1)-Math.max(o.x0,l.x0),h=Math.min(o.z1,l.z1)-Math.max(o.z0,l.z0);(c>=1.5&&Math.abs(h)<.3||h>=1.5&&Math.abs(c)<.3)&&(n.get(o.id).add(l.id),n.get(l.id).add(o.id))}let s=new Set,r=[t[0].id];for(;r.length;){let o=r.pop();if(!s.has(o)){s.add(o);for(let l of n.get(o)||[])s.has(l)||r.push(l)}}this.connectivity=this.connectivity||{},this.connectivity[i]={total:t.length,reachable:s.size}}};var iy=Object.keys(xc);var vc=class{constructor(t=20){this.cell=t,this.map=new Map,this.count=0}key(t,e){return t*73856093^e*19349663}addBox(t,e,i,n,s,r,o="wall"){let l={minX:Math.min(t,n),maxX:Math.max(t,n),minY:Math.min(e,s),maxY:Math.max(e,s),minZ:Math.min(i,r),maxZ:Math.max(i,r),tag:o},c=Math.floor(l.minX/this.cell),h=Math.floor(l.maxX/this.cell),d=Math.floor(l.minZ/this.cell),u=Math.floor(l.maxZ/this.cell);for(let f=c;f<=h;f++)for(let g=d;g<=u;g++){let y=this.key(f,g),p=this.map.get(y);p||(p=[],this.map.set(y,p)),p.push(l)}return this.count++,l}query(t,e,i,n,s=[]){s.length=0;let r=Math.floor(t/this.cell),o=Math.floor(i/this.cell),l=Math.floor(e/this.cell),c=Math.floor(n/this.cell),h=new Set;for(let d=r;d<=o;d++)for(let u=l;u<=c;u++){let f=this.map.get(this.key(d,u));if(f)for(let g of f)h.has(g)||(h.add(g),s.push(g))}return s}raycast(t,e,i,n,s,r,o=100,l=null){let c=null,h=o,d=new Set,u=[],f=Math.ceil(o/6);for(let g=0;g<=f;g++){let y=g/f*o,p=t+n*y,m=i+r*y,x=this.query(p-6,m-6,p+6,m+6,u);for(let v of x){if(d.has(v)||(d.add(v),l&&v.tag===l))continue;let b=Ug(t,e,i,n,s,r,v);b!==null&&b<h&&(h=b,c=v)}}return c?{collider:c,dist:h,point:new P(t+n*h,e+s*h,i+r*h)}:null}};function Ug(a,t,e,i,n,s,r){let o=0,l=1e9,c=[[a,i,r.minX,r.maxX],[t,n,r.minY,r.maxY],[e,s,r.minZ,r.maxZ]];for(let[h,d,u,f]of c)if(Math.abs(d)<1e-8){if(h<u||h>f)return null}else{let g=(u-h)/d,y=(f-h)/d;if(g>y){let p=g;g=y,y=p}if(o=Math.max(o,g),l=Math.min(l,y),o>l)return null}return o}var Ea=class{constructor(t,e={}){this.scene=t,this.seed=e.seed||20261026,this.terrain=new Ma(this.seed),this.colliders=new vc(20),this.builder=new Sa(t,{name:"world_static"}),this.lootSpots=[],this.doorSpecs=[],this.lightPoints=[],this.pois=[],this.arenas={},this.statics=[],this.hazards=[],this.trees=[],this.triggers=[],this.startPosition=new P(-360,0,151),this.layout={buildings:[],camps:[],trees:[],deadTrees:[],grass:[],rocks:[],debris:[],fences:[],props:[],lights:[],loot:[],vehicles:[],caches:[],enemies:[],haze:[],nests:[]},this.time=0}plan(){let t=Date.now();this.planSuburbs(),this.planForest(),this.planIndustrial(),this.planCity(),this.planMilitary(),this.planWasteland(),this.planArenas(),this.planRoadside(),this.planMs=Date.now()-t}addPadAt(t,e,i,n,s,r=3.5,o="building"){let c=this.terrain.rawHeightAt(t,e),h=1,d=Math.cos(s),u=Math.sin(s);for(let[g,y]of[[-1,-1],[1,-1],[1,1],[-1,1],[0,0]]){let p=g*i*.8,m=y*n*.8,x=t+p*d-m*u,v=e+p*u+m*d;c+=this.terrain.rawHeightAt(x,v),h++}let f=c/h;return this.terrain.addPad(t,e,i,n,s,f,r,o),f}planBuilding(t,e,i,n={}){let s=new Pt(Math.floor(e*13.7+i*7.3+this.seed+t.length*91)),r=n.ry??s.pick([0,Math.PI/2,Math.PI,-Math.PI/2]),o=s.int(1,1e9),c=new js({styleName:t,x:e,z:i,ry:r,seed:o,floors:n.floors,w:n.w,d:n.d}).cfg,h=n.w??(c.size[0]+c.size[1])/2,d=n.d??(c.size[2]+c.size[3])/2,u=this.addPadAt(e,i,h/2+1.5,d/2+1.5,r,4,"building"),f={style:t,x:e,z:i,ry:r,seed:o,y:u,w:n.w,d:n.d,floors:n.floors,...n};return this.layout.buildings.push(f),f}planCamp(t,e,i=3){let n=this.addPadAt(t,e,i*1.9,i*1.9,0,5,"camp");return this.layout.camps.push({x:t,z:e,y:n,size:i}),n}placeLots(t,e,i={}){let n=new Pt(this.seed+Og(t)+(i.seed||0)),s=[],r=i.margin??20,o=i.minDist??26,l=0;for(;s.length<e&&l++<e*80;){let c=n.range(t.x0+r,t.x1-r),h=n.range(t.z0+r,t.z1-r),d=this.terrain.roadDist(c,h);if(d.d<d.w*.5+(i.roadClear??12)||Math.hypot(c-this.terrain.crater.x,h-this.terrain.crater.z)<this.terrain.crater.r*1.5||Math.hypot(c-this.terrain.lake.x,h-this.terrain.lake.z)<this.terrain.lake.r*1.4||this.terrain.riverDist(c,h)<12||this.terrain.normalAt(c,h,4).y<(i.minFlat||.93))continue;let f=!0;for(let g of s)if(ya(c,h,g.x,g.z)<o*(g.scale||1)){f=!1;break}f&&this.isFreeOfPads(c,h,o*.6)&&s.push({x:c,z:h,scale:1})}return s}isFreeOfPads(t,e,i){for(let n of this.terrain.pads)if(ya(t,e,n.x,n.z)<i+Math.hypot(n.hw,n.hd))return!1;return!0}addPOI(t,e,i,n,s,r={}){let o=this.terrain.heightAt(i,n),l={id:t,name:e,x:i,z:n,y:o,type:s,region:qs(i,n).id,...r};return this.pois.push(l),l}addLoot(t,e,i,n,s="crate",r={}){this.layout.loot.push({x:t,y:e,z:i,table:n,kind:s,...r})}addLight(t,e,i,n,s,r,o={}){this.layout.lights.push({x:t,y:e,z:i,color:n,intensity:s,range:r,flicker:!!o.flicker,dead:!!o.dead,fire:!!o.fire,spot:o.spot||null})}planShelter(){let i=this.terrain.rawHeightAt(-360,150),n=i-7.4,s=18,r=12;this.startPosition.set(-360,n+.05,152),this.shelter={x:-360,y:n,z:150,w:s,d:r,surfaceY:i},this.terrain.addPad(-360,156,16,24,0,i,8,"shelter"),this.addPOI("shelter12","Shelter 12",-360,150,"shelter")}buildShelter(t){let{x:e,y:i,z:n,w:s,d:r}=this.shelter,o=3.2;t.add(C(s,.4,r),E.floor,e,i-.2,n),t.collideBox(e-s/2,i-.4,n-r/2,e+s/2,i,n+r/2,"floor"),t.add(C(s,.4,r),E.concrete,e,i+o+.2,n),t.collideBox(e-s/2,i+o,n-r/2,e+s/2,i+o+.4,n+r/2,"ceiling");let l=.35;t.add(C(s,o,l),E.concreteWet,e,i+o/2,n-r/2),t.collideBox(e-s/2,i,n-r/2-l/2,e+s/2,i+o,n-r/2+l/2,"wall");for(let p of[-1,1])t.add(C(l,o,r),E.concreteWet,e+p*s/2,i+o/2,n),t.collideBox(e+p*s/2-l/2,i,n-r/2,e+p*s/2+l/2,i+o,n+r/2,"wall");let c=1.7;for(let p of[-1,1]){let m=s/2-c/2;t.add(C(m,o,l),E.concreteWet,e+p*(c/2+m/2),i+o/2,n+r/2),t.collideBox(e+p*c/2,i,n+r/2-l/2,e+p*(c/2+m),i+o,n+r/2+l/2,"wall")}t.add(C(c+.4,.8,l),E.concreteWet,e,i+o-.4,n+r/2),t.add(C(.28,o,4.4),E.panel,e-3.2,i+o/2,n-3.6),t.collideBox(e-3.34,i,n-5.8,e-3.06,i+o,n-1.4,"wall"),t.add(C(.28,o,4.2),E.panel,e+4.4,i+o/2,n+3.8),t.collideBox(e+4.26,i,n+1.7,e+4.54,i+o,n+5.9,"wall");let h=new Pt(31);Bt.bunkBed(t,e-6.6,i,n-3.4,Math.PI/2,h),Bt.bunkBed(t,e-6.6,i,n-.9,Math.PI/2,h),Bt.locker(t,e+7.9,i,n+4.2,-Math.PI/2),Bt.locker(t,e+7.9,i,n+5.1,-Math.PI/2),Bt.table(t,e+1.4,i,n+.6,0,h),Bt.chair(t,e+1.4,i,n+1.6,Math.PI),Bt.cabinet(t,e-7.9,i,n+4.2,Math.PI/2),Bt.shelf(t,e-.4,i,n-4.6,0,1.8,1.6,.4),t.add(C(2.6,1,.9),E.metalPaint,e+6.6,i+.5,n-3.2,[0,-Math.PI/2,0]),t.add(C(.06,.62,1.05),vt("screen",{emissive:5635994,emissiveIntensity:2}),e+6.12,i+1.22,n-3.2,[0,-Math.PI/2,0]),t.add(rt(.05,.05,1.7,5),E.steel,e+7.1,i+1.85,n-2.6),t.add(C(.5,.3,.3),E.rust,e+6.6,i+1.15,n-2.2),t.add(fd(2.4,2.4),vt("blood",{transparent:!0,depthWrite:!1,polygonOffset:!0,alphaTest:.15}),e-5.2,i+.012,n-2.2,[0,h.range(0,6),0]),this.addLight(e+5,i+2.72,n+2,14215388,5.5,11,{flicker:!0}),this.addLight(e-5.5,i+2.72,n-2,10406068,3.2,9),this.addLight(e+6.2,i+1.4,n-3.2,5635994,2.2,5);let d=n+r/2+1.4;for(let p=0;p<20;p++){let m=i+p*.37,x=d+p*1.05;t.add(C(3,.37,1.05),E.concrete,e,m+.185,x),t.collideBox(e-1.5,m,x-.52,e+1.5,m+.37,x+.52,"stairs");for(let v of[-1,1])t.add(C(.3,3.3,1.05),E.concreteWet,e+v*1.72,m+1.65,x),t.collideBox(e+v*1.72-.15,m,x-.52,e+v*1.72+.15,m+3.3,x+.52,"wall");p%5===0&&this.addLight(e,m+2.9,x,16758903,3.2,7,{flicker:p%10===0})}let u=i+20*.37,f=this.shelter.surfaceY,g=d+20*1.05;t.add(C(5.4,2.4,5.4),E.concrete,e,f+.9,g),t.collideBox(e-2.7,f-.3,g-2.7,e+2.7,f+2.2,g+2.7,"wall"),t.add(C(3,.35,3),E.steel,e,f+2.42,g),t.add(C(2.4,.22,2.6),E.hazard,e,f+2.6,g),this.addLight(e,f+2.4,g,16752720,4,10,{flicker:!0}),this.shelter.hatch={x:e,y:f+2.6,z:g},this.addLoot(e+1.2,i+.92,n+.6,"start","medbox"),this.addLoot(e-6.6,i+.62,n-3.4,"start2","crate"),this.addLoot(e+7.9,i,n+4.2,"military","toolbox"),this.addLoot(e-.4,i+1,n-4.6,"house","drawer");let y=new Pt(77);for(let p=0;p<6;p++){let m=y.range(0,6.28),x=y.range(5,14),v=e+Math.cos(m)*x,b=g+Math.sin(m)*x;this.layout.debris.push({x:v,z:b,kind:y.pick(["tire","plank","crate","barrel"]),ry:y.range(0,6.28)})}}planSuburbs(){let t=hi[0],e=new Pt(this.seed+101);this.planShelter();let i=[140,200,260,320,380,440],n=[-620,-560,-500,-440,-380,-320,-260,-200];for(let s of i)for(let r=-640;r<-160;r+=34){let o=e.range(-4,4),l=r+o,c=s+e.range(-3,3);if(this.terrain.roadDist(l,c).d<17||this.terrain.normalAt(l,c,4).y<.9||!this.isFreeOfPads(l,c,14)||e.chance(.28))continue;let h=e.pick(["house","house","ruined_house","house","ruined_house"]),d=c>s?Math.PI:0;this.planBuilding(h,l,c,{ry:d,lootMul:e.range(.7,1.2),lightMul:.45})}for(let s of n)for(let r=60;r<470;r+=36){let o=s+e.range(-4,4),l=r;if(this.terrain.roadDist(o,l).d<16||this.terrain.normalAt(o,l,4).y<.9||!this.isFreeOfPads(o,l,14)||e.chance(.45))continue;let c=o>s?-Math.PI/2:Math.PI/2;this.planBuilding(e.pick(["house","ruined_house"]),o,l,{ry:c,lootMul:e.range(.7,1.1),lightMul:.4})}this.planBuilding("school",-400,300,{ry:Math.PI/2,lootMul:1.2,lightMul:.6}),this.planBuilding("gas_station",-300,236,{ry:0,lootMul:1.1}),this.planBuilding("shop",-230,250,{ry:-Math.PI/2,lootMul:1}),this.planBuilding("shop",-560,250,{ry:Math.PI/2,lootMul:1}),this.addPOI("sub_school","Ravenwood Elementary",-400,300,"landmark"),this.addPOI("sub_gas","Hollis Fuel & Go",-300,236,"landmark"),this.addPOI("sub_church","St. Agnes Church",-520,120,"boss"),this.addPOI("sub_camp","Hollow Street Camp",-252,250,"camp"),this.planCamp(-252,268,3.4),this.addPOI("sub_shelter","Shelter 12 Access",-360,172,"shelter");for(let s=0;s<60;s++){let r=e.range(-660,-140),o=e.range(40,480);if(this.terrain.roadDist(r,o).d<12||!this.isFreeOfPads(r,o,4))continue;let l=e.next(),c=this.terrain.rawHeightAt(r,o);l<.22?this.layout.fences.push({x0:r,z0:o,x1:r+e.range(4,10),z1:o+e.range(-2,2),kind:"wood",h:1.4}):l<.34?this.layout.props.push({kind:"shed",x:r,y:c,z:o,ry:e.range(0,6.28)}):l<.46?this.layout.debris.push({x:r,z:o,kind:e.pick(["rubble","rubble","tire","plank"]),ry:e.range(0,6.28)}):l<.56?this.layout.vehicles.push({x:r,z:o,ry:e.range(0,6.28),type:e.pick(["sedan","van","pickup"])}):l<.66?this.layout.props.push({kind:"garden",x:r,y:c,z:o,ry:e.range(0,6.28)}):l<.74?this.layout.props.push({kind:"playset",x:r,y:c,z:o,ry:e.range(0,6.28)}):l<.82?this.layout.props.push({kind:"mailbox",x:r,y:c,z:o,ry:e.range(0,6.28)}):this.layout.trees.push({x:r,y:c,z:o,kind:e.pick([3,4,3]),s:e.range(.6,1),ry:e.range(0,6.28)})}for(let s=0;s<14;s++){let r=e.range(-650,-150),o=e.range(50,470);this.terrain.roadDist(r,o).d<8||this.addLoot(r,this.terrain.rawHeightAt(r,o),o,"house","body")}}planForest(){let t=hi[1],e=new Pt(this.seed+202);this.forestClearings=[];for(let r=0;r<16;r++)this.forestClearings.push({x:e.range(-660,-140),z:e.range(-480,-30),r:e.range(16,40)});let i=new Pt(this.seed+900),n=4200;for(let r=0;r<n;r++){let o=i.range(-690,-110),l=i.range(-495,-5);if(this.terrain.roadDist(o,l).d<11)continue;let h=!1;for(let p of this.forestClearings)if(ya(o,l,p.x,p.z)<p.r){h=!0;break}if(h&&i.chance(.9))continue;let d=this.terrain.padsAt(o,l);if(d&&d.length||this.terrain.normalAt(o,l,2).y<.6)continue;let f=this.terrain.rawHeightAt(o,l),g=i.pickWeighted([0,1,2,3,4,5,6],p=>p<3?34:p<5?20:8),y=i.range(.75,1.45);this.layout.trees.push({x:o,y:f,z:l,kind:g,s:y,ry:i.range(0,6.28)}),i.chance(.35)||this.layout.grass.push({x:o+i.range(-2,2),z:l+i.range(-2,2),s:i.range(.7,1.3)})}for(let r=0;r<5e3;r++){let o=i.range(-690,-110),l=i.range(-495,-5);if(this.terrain.roadDist(o,l).d<8)continue;let c=this.terrain.padsAt(o,l);c&&c.length||i.chance(.5)||this.layout.grass.push({x:o,z:l,s:i.range(.6,1.5),bush:i.chance(.25)})}for(let r=0;r<260;r++){let o=i.range(-690,-110),l=i.range(-495,-5);if(this.terrain.roadDist(o,l).d<9)continue;let c=this.terrain.padsAt(o,l);if(c&&c.length)continue;let h=this.terrain.rawHeightAt(o,l);i.chance(.35)?this.layout.rocks.push({x:o,y:h,z:l,s:i.range(.4,2.2),seed:i.int(1,9999)}):this.layout.debris.push({x:o,z:l,kind:"log",ry:i.range(0,6.28),s:i.range(.7,1.4)})}let s=[[-500,-260],[-250,-420],[-620,-120],[-340,-80],[-580,-350]];for(let[r,o]of s)this.planBuilding("ruined_house",r,o,{lootMul:1.2,lightMul:.4,ry:0,ruin:.25});this.addPOI("for_cabin","The Hunter's Cabin",-500,-260,"landmark"),this.planBuilding("lab",-300,-300,{ry:.2,lootMul:1.5,lightMul:.8}),this.addPOI("for_outpost","Blackwood Research Post",-300,-300,"landmark"),this.cave={x:-560,z:-400,depth:26},this.addPadAt(-560,-400,12,8,0,6,"cave"),this.addPOI("for_tunnel","Mine Adit 4",-560,-400,"cave"),this.addPOI("for_nest","The Matriarch's Nest",-180,-180,"boss"),this.planCamp(-420,-120,3),this.addPOI("for_camp","Woodcutter's Rest",-420,-120,"camp"),this.hazeVolumes=[{x:-420,z:-180,r:150,y:1,density:.055,color:10135710}]}planIndustrial(){let t=hi[2],e=new Pt(this.seed+303);this.placeLots(t,14,{margin:30,minDist:44,roadClear:13,seed:11}).forEach(n=>{let s=e.pick(["warehouse","factory","warehouse","office","checkpoint"]);this.planBuilding(s,n.x,n.z,{lootMul:1.1,lightMul:.5})}),this.tankFarm={x:60,z:300},this.addPadAt(60,300,44,16,0,4,"tanks");for(let n=0;n<5;n++)this.layout.props.push({kind:"tank",x:20+n*17,y:this.terrain.rawHeightAt(20+n*17,300),z:300});this.addPadAt(230,220,8,8,0,4,"chimney"),this.layout.props.push({kind:"chimney",x:230,y:this.terrain.rawHeightAt(230,220),z:220});for(let n=0;n<2;n++){let s=150+n*62,r=400;this.addPadAt(s,r,20,20,0,5,"cooling"),this.layout.props.push({kind:"cooling",x:s,y:this.terrain.rawHeightAt(s,r),z:r})}for(let n=0;n<30;n++){let s=e.range(-80,280),r=e.range(30,470);if(this.terrain.roadDist(s,r).d<10||!this.isFreeOfPads(s,r,3))continue;let o=this.terrain.rawHeightAt(s,r);this.layout.props.push({kind:e.chance(.5)?"pipes":"pipes_v",x:s,y:o,z:r,ry:e.pick([0,Math.PI/2]),len:e.range(5,12)})}for(let n=0;n<40;n++){let s=e.range(-90,290),r=e.range(20,480);if(this.terrain.roadDist(s,r).d<8)continue;let o=this.terrain.rawHeightAt(s,r);e.chance(.35)?this.layout.props.push({kind:"puddle",x:s,y:o,z:r,r:e.range(1.2,3.4)}):this.layout.props.push({kind:"barrels",x:s,y:o,z:r,n:e.int(1,4)})}this.planBuilding("warehouse",260,80,{ry:0,lootMul:1.3}),this.planCamp(20,60,3),this.addPOI("ind_power","Kolmogor Power Plant",100,250,"landmark"),this.addPOI("ind_depot","Rail Depot",-60,140,"landmark"),this.addPOI("ind_camp","Scrapper Camp",20,60,"camp"),this.addPOI("ind_warehouse","Warehouse 12",260,80,"landmark"),this.addPOI("ind_foundry","Foundry 6",230,420,"boss");for(let n=0;n<3;n++)this.layout.props.push({kind:"rails",x:-60,z:100+n*4,len:120,ry:0});for(let n=0;n<4;n++)this.layout.props.push({kind:"wagon",x:-100+n*26,y:this.terrain.rawHeightAt(-100+n*26,102),z:102,ry:Math.PI/2})}planCity(){let t=hi[3],e=new Pt(this.seed+404),i=[];for(let n=0;n<5;n++)for(let s=0;s<5;s++)i.push({x:-80+n*88,z:-440+s*96});for(let n of i){let s=e.int(1,2);for(let r=0;r<s;r++){let o=n.x+e.range(-20,20),l=n.z+e.range(-22,22);this.terrain.roadDist(o,l).d<15||this.isFreeOfPads(o,l,22)&&(this.terrain.riverDist(o,l)<14||this.terrain.normalAt(o,l,4).y<.9||this.planBuilding(e.pick(["apartment","apartment","office","shop","ruined_house"]),o,l,{lootMul:e.range(.9,1.3),lightMul:.65}))}}this.hospital=this.planBuilding("hospital",40,-300,{ry:0,lootMul:1.6,lightMul:.9,floors:3,w:34,d:24}),this.planBuilding("office",210,-140,{ry:Math.PI/2,lootMul:1.2,floors:3}),this.planBuilding("shop",-46,-84,{ry:0,w:20,d:15,lootMul:1.4}),this.planBuilding("school",170,-420,{ry:Math.PI,lootMul:1.2}),this.addPOI("city_hospital","St. Agnes General Hospital",40,-300,"landmark"),this.addPOI("city_police","Precinct 9",210,-140,"landmark"),this.addPOI("city_market","Vostok Supermarket",-46,-84,"landmark"),this.addPOI("city_school","Kirov Secondary",170,-420,"landmark"),this.addPOI("city_subway","Metro \u2014 Line 2",130,-400,"cave"),this.subway={x:130,z:-400},this.addPadAt(130,-400,5,6,0,4,"subway"),this.overpass={x:-40,z:-240,len:64},this.addPadAt(-40,-240,7,34,0,4,"overpass"),this.planCamp(150,-300,4),this.addPOI("city_camp","Roof Garden Survivors",150,-300,"camp");for(let n=0;n<120;n++){let s=e.range(-95,295),r=e.range(-490,-10),o=this.terrain.roadDist(s,r);if(Math.abs(o.d-(o.w*.5+2.2))>3)continue;let l=this.terrain.rawHeightAt(s,r);this.layout.props.push({kind:e.chance(.55)?"lamp":"trash",x:s,y:l,z:r,broken:e.chance(.4)})}for(let n=0;n<40;n++){let s=e.range(-98,298),r=e.range(-495,-5);this.terrain.roadDist(s,r).d>7||this.layout.vehicles.push({x:s,z:r,ry:e.range(0,6.28),type:e.pick(["sedan","van","sedan","bus"])})}for(let n=0;n<10;n++){let s=this.layout.buildings.filter(o=>o.region==="city");if(!s.length)break;let r=e.pick(s);this.layout.caches.push({x:r.x+e.range(-4,4),z:r.z+e.range(-4,4),floors:2,building:r})}}planMilitary(){let t=hi[4],e=new Pt(this.seed+505);this.planBuilding("bunker",520,-140,{ry:0,lootMul:1.7,lightMul:1,floors:1}),this.planBuilding("lab",400,-380,{ry:0,lootMul:1.5,lightMul:.8}),this.planBuilding("office",610,-300,{ry:Math.PI/2,lootMul:1.2}),this.planBuilding("checkpoint",460,-60,{ry:0,lootMul:1.4}),this.planBuilding("warehouse",560,-420,{ry:0,lootMul:1.4}),this.addPOI("mil_bunker","Installation 7",520,-140,"boss"),this.addPOI("mil_lab","Biolab K-9",400,-380,"landmark"),this.addPOI("mil_barracks","Barracks C",610,-300,"landmark"),this.addPOI("mil_armory","Armory 4",460,-60,"landmark"),this.addPOI("mil_depot","Supply Depot 3",560,-420,"landmark"),this.planCamp(360,-80,3),this.addPOI("mil_camp","Forward Post Delta",360,-80,"camp");let i=330,n=680,s=-470,r=-30;this.layout.fences.push({x0:i,z0:r,x1:n,z1:r,kind:"chain",h:2.6}),this.layout.fences.push({x0:i,z0:s,x1:i,z1:r,kind:"chain",h:2.6});let o=[[350,-250],[430,-250],[520,-250],[350,-120],[620,-400],[380,-430]];for(let[l,c]of o)this.addPadAt(l,c,2.2,2.2,0,2,"tower"),this.layout.props.push({kind:"watchtower",x:l,y:this.terrain.rawHeightAt(l,c),z:c,h:6.5});for(let l=0;l<3;l++)this.layout.props.push({kind:"radiotower",x:360+l*44,y:this.terrain.rawHeightAt(360+l*44,-180),z:-180,h:14+l*4});for(let l=0;l<16;l++){let c=e.range(340,670),h=e.range(-455,-40);this.terrain.roadDist(c,h).d<8||this.layout.vehicles.push({x:c,z:h,ry:e.range(0,6.28),type:e.pick(["military","truck","military"])})}for(let l=0;l<20;l++){let c=e.range(335,675),h=e.range(-460,-35);this.terrain.roadDist(c,h).d<8||this.layout.props.push({kind:"sandbags",x:c,y:this.terrain.rawHeightAt(c,h),z:h,ry:e.pick([0,Math.PI/2]),len:e.range(3,6)})}this.hazards.push({type:"radiation",x:450,z:-250,r:22,dps:2.4});for(let l=0;l<10;l++){let c=i+e.range(10,n-i-20),h=s+e.range(10,r-s-10);this.layout.debris.push({x:c,z:h,kind:"wire",ry:e.chance(.5)?0:Math.PI/2})}}planWasteland(){let t=hi[5],e=new Pt(this.seed+606);for(let i=0;i<700;i++){let n=e.range(320,690),s=e.range(20,480);if(Math.hypot(n-this.terrain.crater.x,s-this.terrain.crater.z)<this.terrain.crater.r*1.15||this.terrain.roadDist(n,s).d<9)continue;let o=this.terrain.padsAt(n,s);o&&o.length||this.layout.deadTrees.push({x:n,z:s,y:this.terrain.rawHeightAt(n,s),kind:e.pick([5,6]),s:e.range(.6,1.5),ry:e.range(0,6.28)})}for(let i=0;i<14;i++){let n=e.range(330,680),s=e.range(30,480);Math.hypot(n-this.terrain.crater.x,s-this.terrain.crater.z)<this.terrain.crater.r*1.15||this.layout.props.push({kind:"crater",x:n,y:this.terrain.rawHeightAt(n,s),z:s,r:e.range(2.5,8)})}for(let i=0;i<11;i++){let n=e.range(340,680),s=e.range(30,480);Math.hypot(n-this.terrain.crater.x,s-this.terrain.crater.z)<this.terrain.crater.r*1.2||this.isFreeOfPads(n,s,6)&&this.layout.props.push({kind:"monolith",x:n,y:this.terrain.rawHeightAt(n,s),z:s,h:e.range(6,17),ry:e.range(0,6.28)})}for(let i=0;i<260;i++){let n=e.range(320,690),s=e.range(20,480);this.layout.rocks.push({x:n,y:this.terrain.rawHeightAt(n,s),z:s,s:e.range(.3,1.6),seed:e.int(1,9999)})}for(let i=0;i<8;i++){let n=e.range(0,6.28),s=this.terrain.lake.x+Math.cos(n)*(this.terrain.lake.r+5),r=this.terrain.lake.z+Math.sin(n)*(this.terrain.lake.r+5);this.layout.nests.push({x:s,y:this.terrain.rawHeightAt(s,r),z:r,r:e.range(2.2,4.2)})}this.signalArray={x:640,z:120},this.addPadAt(640,120,32,32,0,6,"array"),this.addPOI("was_array","The Signal Array",640,120,"boss"),this.addPOI("was_crater","Impact Crater",this.terrain.crater.x,this.terrain.crater.z,"boss"),this.addPOI("was_lake","Mirror Lake",this.terrain.lake.x,this.terrain.lake.z,"landmark"),this.addPOI("was_dig","Excavation Site 9",600,430,"landmark"),this.planCamp(380,400,3),this.addPOI("was_camp","Ash Nomads",380,400,"camp"),this.addPadAt(600,430,12,12,0,5,"dig"),this.layout.props.push({kind:"dig",x:600,y:this.terrain.rawHeightAt(600,430),z:430}),this.layout.props.push({kind:"array",x:640,y:this.terrain.rawHeightAt(640,120),z:120})}planArenas(){this.addPadAt(-520,120,9,13,0,5,"arena"),this.arenas.hollow_church={x:-520,y:this.terrain.rawHeightAt(-520,120),z:120,radius:10,boss:"hollow_king"},this.addPadAt(230,420,20,20,0,6,"arena"),this.arenas.foundry_pit={x:230,y:this.terrain.rawHeightAt(230,420),z:420,radius:17,boss:"iron_abomination"},this.addPadAt(-180,-180,18,18,0,8,"arena"),this.arenas.nest_clearing={x:-180,y:this.terrain.rawHeightAt(-180,-180),z:-180,radius:15,boss:"forest_matriarch"};let t=this.terrain.crater,e=t.x-t.r*.5,i=t.z+t.r*.55;this.addPadAt(e,i,20,20,0,8,"arena"),this.arenas.crater_rim={x:e,y:this.terrain.rawHeightAt(e,i),z:i,radius:16,boss:"contaminated_titan"},this.addPadAt(520,-60,16,16,0,6,"arena"),this.arenas.bunker_gate={x:520,y:this.terrain.rawHeightAt(520,-60),z:-60,radius:13,boss:"pale_commander"},this.arenas.signal_array={x:640,y:this.terrain.rawHeightAt(640,120),z:120,radius:26,boss:"last_signal"},this.hazards.push({type:"radiation",x:e,z:i,r:18,dps:1.2})}planRoadside(){let t=new Pt(this.seed+909);for(let e of Xs)for(let i=0;i<e.pts.length-1;i++){let[n,s]=e.pts[i],[r,o]=e.pts[i+1],l=Math.hypot(r-n,o-s),c=(r-n)/l,h=(o-s)/l,d=Math.atan2(c,h);for(let u=0;u<l;u+=10){let f=n+c*u,g=s+h*u,y=t.chance(.5)?1:-1,p=e.width*.5+t.range(1.5,5),m=f+h*y*p,x=g-c*y*p;if(Math.abs(m)>690||Math.abs(x)>490||!this.isFreeOfPads(m,x,2)&&t.chance(.8))continue;let v=this.terrain.rawHeightAt(m,x),b=t.next();b<.26?this.layout.vehicles.push({x:m,z:x,ry:t.range(0,6.28)+d,type:null,wrecked:t.chance(.5)}):b<.38?this.layout.props.push({kind:"lamp",x:m,y:v,z:x,broken:t.chance(.45)}):b<.46?this.layout.props.push({kind:"jersey",x:m,y:v,z:x,ry:d,len:t.range(2,4)}):b<.54?this.layout.debris.push({x:m,z:x,kind:t.pick(["rubble","tire","plank"]),ry:t.range(0,6.28)}):b<.6&&this.layout.props.push({kind:"cone",x:m,y:v,z:x}),t.chance(.05)&&this.addLoot(m,v,x,t.chance(.5)?"car":"house",t.pick(["crate","toolbox","body"]))}if(e.main)for(let u=0;u<l;u+=4.2){let f=n+c*u,g=s+h*u;t.chance(.25)||this.layout.debris.push({x:f,z:g,kind:"line",ry:d,y:this.terrain.rawHeightAt(f,g)+.03})}}for(let e=-640;e<-140;e+=32){let i=214+Math.sin(e*.02)*18;this.layout.props.push({kind:"powerpole",x:e,y:this.terrain.rawHeightAt(e,i),z:i,ry:.1})}}async generate(t=()=>{}){let e=Date.now(),i=async(n,s,r)=>{t(n,r),await new Promise(o=>setTimeout(o,0)),s()};return await i("planning",()=>this.plan(),.02),await i("terrain",()=>this.buildTerrain(),.1),await i("shelter",()=>this.buildShelter(this.builder),.18),await i("buildings",()=>this.materializeBuildings(this.layout.buildings,null),.3),await i("props",()=>this.materializeProps(),.5),await i("vegetation",()=>this.materializeVegetation(),.66),await i("camps",()=>this.materializeCamps(),.74),await i("arenas",()=>this.materializeArenas(),.84),await i("lighting",()=>this.materializeLights(),.92),await i("finalize",()=>this.finalize(),.98),t("ready",1),this.genMs=Date.now()-e,this}buildTerrain(){this.terrain.build(this.scene),this.water=[],this.water.push(this.makeWater(.62,-3.1,"river")),this.water.push(this.makeWater(.5,this.terrain.lake.level,"lake"))}makeWater(t,e,i){let n=new ze(1400,1e3,1,1),s=new Li({color:i==="lake"?2372139:2503482,roughness:.34,metalness:.12,transparent:!0,opacity:Math.min(.92,t+.2),envMapIntensity:.25});s.userData.texName="water";let r=new At(n,s);return r.rotation.x=-Math.PI/2,r.position.set(0,e,0),r.userData.water={kind:i,level:e},r.renderOrder=2,this.scene.add(r),r}materializeBuildings(t,e){for(let i of t){if(i._built)continue;i._built=!0;let n=qs(i.x,i.z),s=new js({styleName:i.style,x:i.x,z:i.z,ry:i.ry,seed:i.seed,y:i.y,w:i.w,d:i.d,floors:i.floors,lootMul:i.lootMul,lightMul:i.lightMul,ruin:i.ruin,noRoof:i.noRoof});s.build(this.builder,i.y),i.builtRooms=s.rooms,i.entrance=s.entrance,i.wFinal=s.w,i.dFinal=s.d,i.floorsFinal=s.floors;for(let r of s.lootPoints)this.addLoot(r.x,r.y+.02,r.z,r.table,r.kind);for(let r of s.doors)this.doorSpecs.push(r);for(let r of s.lightPoints)r.dead||this.addLight(r.x,r.y,r.z,r.color,r.intensity,r.range,{flicker:r.flicker});this.statics.push({type:"building",style:i.style,x:i.x,z:i.z,y:i.y,w:s.w,d:s.d,ry:s.ry,floors:s.floors,rooms:s.rooms.length,entrance:s.entrance,region:n.id,name:i.name||""})}}materializeProps(){let t=this.builder,e=new Pt(this.seed+1234);for(let i of this.layout.vehicles){let n=this.terrain.heightAt(i.x,i.z);gd(t,i.x,n,i.z,i.ry,e,i.type,{wrecked:!!i.wrecked})}for(let i of this.layout.fences){let n=this.terrain.heightAt(i.x0,i.z0);Qe.fence(t,i.x0,i.z0,i.x1,i.z1,n,i.h??2,i.kind??"chain")}for(let i of this.layout.props){let n=i.y??this.terrain.heightAt(i.x,i.z);switch(i.kind){case"shed":{t.add(C(3.2,2.3,2.6),E.woodWeathered,i.x,n+1.15,i.z,[0,i.ry,0]),t.add(C(3.6,.16,3),E.corrugated,i.x,n+2.36,i.z,[0,i.ry,0]),t.collideBox(i.x-1.7,n,i.z-1.4,i.x+1.7,n+2.4,i.z+1.4,"shed"),this.addLoot(i.x+1.2,n,i.z-1.9,"tool","toolbox");break}case"garden":for(let s=0;s<5;s++)t.add(C(.55,.26,3.4),E.dirt,i.x+s*.85,n+.13,i.z,[0,i.ry,0]);break;case"playset":t.add(C(.12,2.4,.12),E.rust,i.x-1.2,n+1.2,i.z),t.add(C(.12,2.4,.12),E.rust,i.x+1.2,n+1.2,i.z),t.add(C(2.6,.1,.1),E.rust,i.x,n+2.35,i.z),t.add(C(.7,.1,.3),E.rust,i.x,n+1,i.z);break;case"mailbox":t.add(rt(.05,.05,1.1,5),E.rust,i.x,n+.55,i.z),t.add(C(.3,.25,.5),E.metalPaint,i.x,n+1.2,i.z);break;case"lamp":Qe.lampPost(t,i.x,n,i.z,i.broken);break;case"powerpole":Qe.powerPole(t,i.x,n,i.z,i.ry);break;case"jersey":Qe.jersey(t,i.x,n,i.z,i.ry,i.len);break;case"cone":Qe.trafficCone(t,i.x,n,i.z);break;case"pipes":Qe.pipes(t,i.x,n,i.z,i.ry,i.len);break;case"pipes_v":Qe.pipesVertical(t,i.x,n,i.z,i.len);break;case"watchtower":Qe.watchtower(t,i.x,n,i.z,i.h);break;case"radiotower":Qe.radioTower(t,i.x,n,i.z,i.h,e);break;case"sandbags":Bt.sandbagWall(t,i.x,n,i.z,i.ry,i.len);break;case"trash":t.add(rt(.3,.26,.9,10),E.rust,i.x,n+.45,i.z),t.add(rt(.33,.33,.05,10),E.steel,i.x,n+.92,i.z),t.collideBox(i.x-.32,n,i.z-.32,i.x+.32,n+.9,i.z+.32,"prop");break;case"barrels":for(let s=0;s<i.n;s++)Bt.barrel(t,i.x+e.range(-1.4,1.4),n,i.z+e.range(-1.4,1.4),e);break;case"puddle":{let s=new At(new oa(i.r,14),vt("radiation",{emissive:6750020,emissiveIntensity:.9,transparent:!0,opacity:.9}));s.rotation.x=-Math.PI/2,s.position.set(i.x,n+.05,i.z),this.scene.add(s),this.hazards.push({type:"radiation",x:i.x,z:i.z,r:i.r,dps:1.4});break}case"tank":t.add(rt(5,5,12,18),E.steel,i.x,n+6,i.z),t.add(rt(5.2,5.2,.4,18),E.rust,i.x,n+12,i.z),t.collideBox(i.x-5,n,i.z-5,i.x+5,n+12,i.z+5,"tank");for(let s=0;s<4;s++){let r=s/4*Math.PI*2;t.add(rt(.3,.3,3,6),E.rust,i.x+Math.cos(r)*4,n+1.5,i.z+Math.sin(r)*4)}break;case"chimney":t.add(rt(3.2,5,44,16),E.brick,i.x,n+22,i.z),t.add(rt(3.6,3.4,2,16),E.rust,i.x,n+44,i.z),t.collideBox(i.x-5,n,i.z-5,i.x+5,n+44,i.z+5,"chimney");break;case"cooling":t.add(rt(14,18,34,20,4,!0),E.concrete,i.x,n+17,i.z),t.add(rt(16,18.6,2.4,20),E.concrete,i.x,n+34,i.z),t.collideBox(i.x-18,n,i.z-18,i.x+18,n+34,i.z+18,"tower"),this.addLoot(i.x+20,n,i.z+20,"industrial","crate");break;case"rails":for(let s=0;s<2;s++)t.add(C(.12,.14,i.len),E.steel,i.x+s*1.5,n+.1,i.z);for(let s=0;s<i.len;s+=1.4)t.add(C(2,.1,.24),E.woodWeathered,i.x+.75,n+.02,i.z-i.len/2+s);break;case"wagon":t.add(C(3,2.6,12),E.rust,i.x,n+1.6,i.z,[0,i.ry,0]);for(let s of[-1,1])for(let r of[-1,1])t.add(rt(.5,.5,.3,10),E.steel,i.x+r*1.6,n+.5,i.z+s*4,[0,0,Math.PI/2]);t.collideBox(i.x-1.6,n,i.z-6,i.x+1.6,n+3,i.z+6,"wagon");break;case"crater":{let s=new At(new Ei(i.r,12,7,0,Math.PI*2,0,Math.PI/2),vt("sand",{color:10127480}));s.scale.y=.4,s.position.set(i.x,n-i.r*.4+.05,i.z),s.receiveShadow=!0,this.scene.add(s);break}case"monolith":t.add(C(e.range(1.6,3.6),i.h,e.range(1.2,2.8)),E.rock,i.x,n+i.h/2,i.z,[e.range(-.06,.06),i.ry,e.range(-.06,.06)]),t.collideBox(i.x-2,n,i.z-2,i.x+2,n+i.h,i.z+2,"monolith");break;case"dig":for(let s=0;s<12;s++){let r=e.range(0,6.28),o=e.range(2,11);t.add(C(1.2,.8,1),E.rust,i.x+Math.cos(r)*o,n+.4,i.z+Math.sin(r)*o,[0,r,0])}t.add(C(9,.3,9),E.gravel,i.x,n+.05,i.z,[0,0,0]),t.add(C(8,.6,8),E.dirt,i.x,n-.1,i.z),this.addLoot(i.x+4,n,i.z+4,"rare","stash"),this.addLoot(i.x-3,n,i.z-3,"warden","toolbox");break;case"array":this.buildSignalArray(i.x,i.z);break}}for(let i of this.layout.debris){let n=i.y??this.terrain.heightAt(i.x,i.z);switch(i.kind){case"rubble":Qe.rubblePile(t,i.x,n,i.z,e,e.range(.8,2.4));break;case"tire":t.add(rt(.34,.34,.2,12),ye(1842202,{roughness:.95}),i.x,n+.1,i.z,[Math.PI/2,0,i.ry]);break;case"plank":t.add(C(.22,.05,1.8),E.woodWeathered,i.x,n+.03,i.z,[0,i.ry,0]),t.collideBox(i.x-.4,n,i.z-.9,i.x+.4,n+.06,i.z+.9,"debris");break;case"log":t.add(rt(.26*(i.s||1),.3*(i.s||1),2.6*(i.s||1),8),E.bark,i.x,n+.28,i.z,[0,i.ry,Math.PI/2]),t.collideBox(i.x-1.3*(i.s||1),n,i.z-.3,i.x+1.3*(i.s||1),n+.55,i.z+.3,"log");break;case"wire":Qe.barbedWire(t,i.x,i.z,i.x+12*(i.ry?1:0),i.z+12*(i.ry?0:1),n);break;case"line":t.add(C(.16,.02,2.1),ye(12103824,{roughness:.9}),i.x,n,i.z,[0,i.ry,0]);break}}for(let i of this.layout.nests)this.buildNest(i);for(let i of this.layout.caches){let n=i.building,s=n.y+(n.floorsFinal||3)*3+.6;this.addLoot(i.x,s,i.z,"rare","stash")}}materializeVegetation(){this.treeGeos||(this.treeGeos=yd());let t=this.treeGeos.map(()=>[]);for(let e of this.layout.trees)t[Z(e.kind,0,t.length-1)].push(e),e.noCollide||this.trees.push({x:e.x,y:e.y,z:e.z,r:.42*e.s,h:this.treeGeos[e.kind].height*e.s});for(let e=0;e<this.treeGeos.length;e++){let i=t[e];if(!i.length)continue;let n=this.treeGeos[e],s=new Qt,r=new ei,o=new P,l=new P,c=new Fi(n.trunk,E.bark,i.length);c.castShadow=!0,c.receiveShadow=!0;for(let h=0;h<i.length;h++){let d=i[h];l.set(d.x,d.y,d.z),r.setFromEuler(new Be(0,d.ry,0)),o.set(d.s,d.s*(.9+h*37%13/40),d.s),s.compose(l,r,o),c.setMatrixAt(h,s)}if(c.instanceMatrix.needsUpdate=!0,c.frustumCulled=!1,this.scene.add(c),n.foliage){let h=new Fi(n.foliage,E.leaves,i.length);h.castShadow=!1,h.receiveShadow=!1;let d=new mt;for(let u=0;u<i.length;u++){let f=i[u];l.set(f.x,f.y,f.z),r.setFromEuler(new Be(0,f.ry,0)),o.set(f.s,f.s*(.9+u*53%17/50),f.s),s.compose(l,r,o),h.setMatrixAt(u,s);let g=.72+u*29%31/62;d.setRGB(g*.95,g*1.02,g*.78),h.setColorAt(u,d)}h.instanceMatrix.needsUpdate=!0,h.instanceColor&&(h.instanceColor.needsUpdate=!0),h.frustumCulled=!1,this.scene.add(h)}}if(this.layout.deadTrees.length){let e=this.treeGeos[5],i=this.layout.deadTrees,n=new Fi(e.trunk,E.bark,i.length);n.castShadow=!0;let s=new Qt;i.forEach((r,o)=>{s.compose(new P(r.x,r.y,r.z),new ei().setFromEuler(new Be(0,r.ry,0)),new P(r.s,r.s,r.s)),n.setMatrixAt(o,s),this.trees.push({x:r.x,y:r.y,z:r.z,r:.3*r.s,h:6*r.s})}),n.instanceMatrix.needsUpdate=!0,n.frustumCulled=!1,this.scene.add(n)}if(this.layout.grass.length){let e=Fg(),i=new Fi(e,E.grassCard,this.layout.grass.length);i.castShadow=!1,i.receiveShadow=!0;let n=new Qt,s=new mt;this.layout.grass.forEach((r,o)=>{let l=this.terrain.heightAt(r.x,r.z),c=r.s;n.compose(new P(r.x,l,r.z),new ei().setFromEuler(new Be(0,o*2.399%6.283,0)),new P(c*(r.bush?1.6:1),c*(r.bush?1.4:.9),c*(r.bush?1.6:1))),i.setMatrixAt(o,n);let h=.62+o*17%37/60;s.setRGB(h*.85,h*.92,h*.62),i.setColorAt(o,s)}),i.instanceMatrix.needsUpdate=!0,i.instanceColor&&(i.instanceColor.needsUpdate=!0),i.frustumCulled=!1,this.scene.add(i),this.grassMesh=i}if(this.layout.rocks.length){let e=[Ys(11,1),Ys(22,0),Ys(33,1)],i=[[],[],[]];this.layout.rocks.forEach((n,s)=>i[s%3].push(n)),i.forEach((n,s)=>{if(!n.length)return;let r=new Fi(e[s],E.rock,n.length);r.castShadow=!0,r.receiveShadow=!0;let o=new Qt;n.forEach((l,c)=>{o.compose(new P(l.x,l.y+l.s*.25,l.z),new ei().setFromEuler(new Be(0,l.seed%6.28,0)),new P(l.s,l.s*.75,l.s*1.1)),r.setMatrixAt(c,o),l.s>.9&&this.colliders.addBox(l.x-l.s*.8,l.y,l.z-l.s*.9,l.x+l.s*.8,l.y+l.s*.8,l.z+l.s*.9,"rock")}),r.instanceMatrix.needsUpdate=!0,r.frustumCulled=!1,this.scene.add(r)})}}materializeCamps(){let t=new Pt(this.seed+55);for(let e of this.layout.camps){let i=this.builder,{x:n,z:s,y:r,size:o}=e;for(let d=0;d<9;d++){let u=d/9*Math.PI*2;d!==3&&Qe.jersey(i,n+Math.cos(u)*o*1.9,r,s+Math.sin(u)*o*1.9,-u,1.5)}Bt.fireplace(i,n,r,s);for(let d=0;d<4;d++){let u=t.range(0,6.28),f=t.range(.9,1.5);i.add(rt(.09,.08,.7,6),E.woodWeathered,n+Math.cos(u)*f,r+.1,s+Math.sin(u)*f,[Math.PI/2,u,0])}for(let d of[-1,1])i.add(rt(.02,.02,1.6,5),E.rust,n+d*.34,r+.8,s,[.18*d,0,.18*d]);i.add(rt(.22,.17,.28,10),E.steel,n,r+.72,s);for(let d=0;d<2;d++){let u=d/2*Math.PI+t.range(-.35,.35),f=n+Math.cos(u+1.57)*o*1.15,g=s+Math.sin(u+1.57)*o*1.15,y=this.terrain.heightAt(f,g),p=u;i.add(C(3.1,.05,2.5),E.fabric,f,y+.03,g,[0,p,0]);for(let m of[-1,1])i.add(C(3.2,.07,1.42),E.fabric,f+Math.cos(p)*m*.62,y+1.05,g-Math.sin(p)*m*.62,[0,p,m*.62]);i.add(C(.1,1.55,2.1),E.fabric,f+Math.cos(p)*1.52,y+.8,g-Math.sin(p)*1.52,[0,p,0]),i.add(rt(.035,.035,3.3,6),E.woodWeathered,f,y+1.5,g,[0,p,Math.PI/2]),i.add(rt(.14,.14,2.1,8),E.fabric,f-Math.cos(p)*1.5,y+1.35,g+Math.sin(p)*1.5,[Math.PI/2,p,0]),i.collideBox(f-1.6,y,g-1.3,f+1.6,y+1.55,g+1.3,"tent"),i.add(C(.8,.12,1.8),E.fabric,f,y+.12,g,[0,p+1.57,0])}Bt.crate(i,n+o*1.45,r,s-o*.5,t.range(0,3)),Bt.crate(i,n+o*1.5,r+.62,s-o*.4,t.range(0,3),.75),Bt.crate(i,n-o*1.1,r,s+o*1.2,t.range(0,3),.9),Bt.barrel(i,n+o*.2,r,s-o*1.5,t),Bt.barrel(i,n-o*1.6,r,s-o*1.2,t),Bt.table(i,n-o*.6,r,s-o*1.15,.4,t),Bt.chair(i,n-o*.15,r,s-o*.85,-1),Bt.chair(i,n-o*1.2,r,s-o*1.5,2.2);let l=n-o*1.7,c=s-o*1,h=this.terrain.heightAt(l,c);for(let[d,u,f]of[[-1.2,-1.1,2.5],[1.2,-1.1,2.5],[-1.2,1.1,1.7],[1.2,1.1,1.7]])i.add(rt(.05,.05,f,6),E.woodWeathered,l+d,h+f/2,c+u);i.add(C(2.8,.06,2.6),E.fabric,l,h+2.05,c,[.3,.15,0]),Bt.sandbagWall(i,n+o*2.3,r,s+o*.4,Math.PI/2,2.6),Bt.sandbagWall(i,n+o*2.3,r,s-o*1.2,Math.PI/2,1.8),Bt.machine(i,n+o*1.35,r,s+o*.3,.2,1.2,.9,.7),i.add(C(.34,.24,.22),E.metalPaint,n+o*1.35,r+1,s-o*.55,[0,.5,0]),i.add(rt(.01,.01,.6,4),E.steel,n+o*1.35,r+1.4,s-o*.55);for(let d=0;d<5;d++)i.add(rt(.035,.035,.11,6),E.steel,n-o*.6+t.range(-.5,.5),r+.66,s-o*1.15+t.range(-.3,.3));i.add(C(.5,.03,.4),E.fabric,n-o*.05,r+.66,s-o*1.3,[0,t.range(0,3),0]),this.addLoot(n+o*1.4,r,s+o*.4,"house","stash"),this.addLoot(n-o*.6,r+.66,s-o*1.1,"store","crate"),this.addLoot(n-o*1.5,r,s+o*1.1,"tool","bag"),this.addLight(n,r+.8,s,16747066,9,14,{fire:!0,flicker:!0}),this.addLight(n+o*1.3,r+1.4,s-o*.5,16760944,2.2,7,{flicker:!1})}}materializeArenas(){let t=this.builder,e=new Pt(this.seed+707);{let{x:i,y:n,z:s}=this.arenas.hollow_church;t.add(C(14,1,22),E.floor,i,n-.5,s),t.collideBox(i-7,n-1,s-11,i+7,n,s+11,"floor");for(let r of[-1,1]){t.add(C(.8,8,22),E.brick,i+r*7,n+4,s),t.collideBox(i+r*7-.4,n,s-11,i+r*7+.4,n+8,s+11,"wall");for(let o=0;o<4;o++)t.add(C(.9,2.4,1),ye(3155999,{roughness:.4}),i+r*7,n+4.6,s-7+o*4.6)}t.add(C(14,8,.8),E.brick,i,n+4,s-11),t.collideBox(i-7,n,s-11.4,i+7,n+8,s-10.6,"wall"),t.add(C(14,1.2,14),E.brick,i,n+8.4,s),t.add(C(10,.6,4),E.concrete,i,n+.3,s-8),t.add(C(1.2,3.2,1.2),E.wood,i,n+1.9,s-9.5);for(let r=0;r<9;r++){let o=s-4+r*1.9;for(let l of[-1,1])e.chance(.25)||(t.add(C(2.6,.12,.5),E.wood,i+l*3.4,n+.55,o),t.add(C(2.6,.7,.1),E.wood,i+l*3.4,n+.9,o-.22))}for(let r=0;r<30;r++){let o=e.range(0,6.28),l=e.range(0,8);t.add(Je(e.range(.1,.2),5),E.paper,i+Math.cos(o)*l,n+.14,s-6+Math.sin(o)*l*.6)}this.addLight(i,n+6,s,16740416,13,24,{flicker:!0}),this.addLoot(i+4,n,s-9,"rare","stash")}{let{x:i,y:n,z:s}=this.arenas.foundry_pit;t.add(rt(18,18,1.2,24),E.concrete_floor,i,n-.6,s),t.collideBox(i-18,n-1.2,s-18,i+18,n,s+18,"floor");for(let r=0;r<18;r++){if(r%6===0)continue;let o=r/18*6.28;t.add(C(6.4,6,1.2),E.corrugated,i+Math.cos(o)*18.5,n+3,s+Math.sin(o)*18.5,[0,-o,0]),t.collideBox(i+Math.cos(o)*18.5-3.4,n,s+Math.sin(o)*18.5-3.4,i+Math.cos(o)*18.5+3.4,n+6,s+Math.sin(o)*18.5+3.4,"wall")}t.add(C(6,5,3),E.steel,i,n+2.5,s-16),t.add(C(4,3,.4),vt("radiation",{emissive:16733456,emissiveIntensity:1.6}),i,n+2.2,s-14.6);for(let r=0;r<3;r++)t.add(C(30,.3,2),E.steel,i,n+4.5+r*1.2,s+8+r*2.4);for(let r=0;r<8;r++){let o=e.range(0,6.28),l=e.range(4,15);t.add(C(1.2,.8,1),E.rust,i+Math.cos(o)*l,n+.4,s+Math.sin(o)*l,[0,o,0])}this.addLight(i,n+5,s-10,16738848,18,30,{flicker:!0})}{let{x:i,y:n,z:s}=this.arenas.nest_clearing;t.add(rt(16,16,.4,20),E.dirt,i,n,s),t.add(Je(6,10),E.nest,i,n+.8,s,[0,0,0],{x:1.6,y:.5,z:1.4});for(let r=0;r<14;r++){let o=r/14*6.28;t.add(C(.3,e.range(3,9),.3),E.nest,i+Math.cos(o)*13,n+4,s+Math.sin(o)*13,[e.range(-.2,.2),o,e.range(-.2,.2)])}for(let r=0;r<10;r++){let o=e.range(0,6.28),l=e.range(6,16);t.add(new ze(e.range(3,7),e.range(3,6)),vt("nest",{transparent:!0,opacity:.5,side:_e,depthWrite:!1}),i+Math.cos(o)*l,n+e.range(2,8),s+Math.sin(o)*l,[e.range(-.4,.4),o,e.range(-.4,.4)])}this.addLight(i,n+6,s,8956518,8,20)}{let{x:i,y:n,z:s}=this.arenas.crater_rim;for(let r=0;r<12;r++){let o=r/12*6.28;t.add(C(4,e.range(2,6),1.6),E.rock,i+Math.cos(o)*16,n+1.5,s+Math.sin(o)*16,[e.range(-.3,.3),o,e.range(-.3,.3)])}this.addLight(i,n+3,s,16728096,10,26)}{let{x:i,y:n,z:s}=this.arenas.bunker_gate;t.add(C(26,1,26),E.concrete,i,n-.5,s),t.collideBox(i-13,n-1,s-13,i+13,n,s+13,"pad"),t.add(C(8,6,1.2),E.steel,i,n+3,s-12),t.add(C(8.4,.4,1.5),E.hazard,i,n+6.2,s-12);for(let r=0;r<4;r++)t.add(C(.2,6,1.2),E.rust,i-3+r*2,n+3,s-12);t.add(C(8,6,1.2),E.steel,i,n+3,s+12),Bt.sandbagWall(t,i-8,n,s+4,0,6),Bt.sandbagWall(t,i+8,n,s+4,0,6),t.collideBox(i-12,n,s-12.6,i-8,n+6,s-11.4,"wall"),t.collideBox(i+8,n,s-12.6,i+12,n+6,s-11.4,"wall"),this.addLight(i,n+6,s-8,16724e3,11,22,{flicker:!0})}this.cave&&this.buildCave(this.cave),this.subway&&this.buildSubway(this.subway),this.overpass&&this.buildOverpass(this.overpass)}buildSignalArray(t,e){let i=this.terrain.heightAt(t,e),n=this.builder;n.add(C(60,.6,60),E.concrete,t,i-.2,e),n.collideBox(t-30,i-.6,e-30,t+30,i,e+30,"pad");for(let s=0;s<8;s++){let r=s/8*Math.PI*2,o=t+Math.cos(r)*22,l=e+Math.sin(r)*22;n.add(rt(.4,.75,22,8),E.steel,o,i+11,l),n.add(C(3.4,.28,.28),E.steel,o,i+22,l,[0,r,0]),n.add(C(2.4,.28,.28),E.steel,o,i+19,l,[0,r,0]),n.collideBox(o-.8,i,l-.8,o+.8,i+22,l+.8,"pylon")}n.add(rt(4,5,6,12),E.concreteWet,t,i+3,e),n.add(rt(4.2,4.2,.4,12),E.steel,t,i+6,e),n.add(rt(1.2,1.8,8,10),E.armor,t,i+10,e),n.add(rt(.2,.5,3,8),vt("radiation",{emissive:10121471,emissiveIntensity:2.2}),t,i+15.5,e),n.collideBox(t-5,i,e-5,t+5,i+6,e+5,"core");for(let s=0;s<3;s++){let r=s/3*6.28+.4;n.add(C(2.2,1,.8),E.metalPaint,t+Math.cos(r)*12,i+.5,e+Math.sin(r)*12,[0,-r,0]),n.add(C(1.2,.6,.06),vt("screen",{emissive:8978380,emissiveIntensity:1.4}),t+Math.cos(r)*11.7,i+1.1,e+Math.sin(r)*11.7,[0,-r,.3])}this.addLight(t,i+7,e,10121471,20,40),this.addLoot(t+6,i,e+6,"warden","stash")}buildCave(t){let{x:e,z:i,depth:n}=t,s=this.terrain.heightAt(e,i),r=this.builder;r.add(Ys(77,2),E.rock,e,s+2,i-2,[0,0,0],{x:11,y:6.5,z:8});for(let h=0;h<n;h+=3){let d=i+h,u=s-h*.17;for(let f of[-1,1])r.add(C(.7,4.4,3.1),E.rock,e+f*3.1,u+2.2,d),r.collideBox(e+f*3.1-.35,u,d-1.55,e+f*3.1+.35,u+4.4,d+1.55,"cave");r.add(C(6.9,.5,3.1),E.rock,e,u-.25,d),r.add(C(6.9,.5,3.1),E.rock,e,u+4.4,d),r.collideBox(e-3.45,u-.5,d-1.55,e+3.45,u,d+1.55,"cave")}let o=i+n,l=s-n*.17;r.add(C(24,.6,22),E.rock,e,l-.3,o),r.add(C(24,.6,22),E.rock,e,l+7.2,o),r.collideBox(e-12,l-.6,o-11,e+12,l,o+11,"cave");for(let[h,d,u,f]of[[-12,0,.8,22],[12,0,.8,22],[0,-11,24,.8],[0,11,24,.8]])r.add(C(u,7.2,f),E.rock,e+h,l+3.6,o+d),r.collideBox(e+h-u/2,l,o+d-f/2,e+h+u/2,l+7.2,o+d+f/2,"cave");let c=new Pt(Math.floor(e+i));for(let h=0;h<26;h++){let d=e+c.range(-10,10),u=o+c.range(-9,9);r.add(Je(c.range(.1,.32),6),vt("radiation",{emissive:6750088,emissiveIntensity:1.5}),d,l+c.range(0,.4),u)}this.addLoot(e+6,l,o+6,"rare","stash"),this.addLoot(e-6,l,o-6,"mutant","body"),this.addLight(e,l+6,o,6750105,10,20),this.addLight(e,l+3,o+6,6750105,4,9)}buildSubway(t){let{x:e,z:i}=t,n=this.terrain.heightAt(e,i),s=this.builder;for(let o=0;o<12;o++){let l=n-o*.35;s.add(C(6,.36,1.35),E.concrete,e,l-.18,i+o*1.3),s.collideBox(e-3,l-.36,i+o*1.3-.67,e+3,l,i+o*1.3+.67,"stairs")}let r=n-12*.35;for(let o=0;o<4;o++){let l=i+17+o*12;for(let c of[-1,1])s.add(C(1,5,12),E.tiles,e+c*7,r+.5,l),s.collideBox(e+c*7-.5,r-2,l-6,e+c*7+.5,r+3,l+6,"wall");s.add(C(15,.5,12),E.concrete,e,r-2.2,l),s.add(C(15,.5,12),E.concrete,e,r+3.4,l),this.addLight(e+(o%2?3:-3),r+2.7,l,10145984,4.5,10,{flicker:o%2===0});for(let c=0;c<3;c++)s.add(rt(.08,.08,.5,6),E.steel,e+(o%2?4:-4),r+2.9,l-3+c*3)}s.add(C(1.2,.2,48),E.steel,e+5.5,r-1.9,i+36),this.addLoot(e-4,r-1.9,i+20,"military","body"),this.addLoot(e+3,r-1.9,i+40,"house","crate"),this.hazards.push({type:"dark",x:e,z:i+36,r:24})}buildOverpass(t){let{x:e,z:i,len:n}=t,s=this.terrain.heightAt(e,i),r=this.builder;r.add(C(n,1.2,11),E.concrete,e,s+7.5,i),r.collideBox(e-n/2,s+7,i-5.5,e+n/2,s+8.7,i+5.5,"bridge");for(let l=0;l<4;l++){let c=e-n/2+6+l*(n/3.2);for(let h of[-1,1])r.add(C(2.2,7,2.2),E.concrete,c,s+3.5,i+h*3.6),r.collideBox(c-1.1,s,i+h*3.6-1.1,c+1.1,s+7,i+h*3.6+1.1,"pillar")}for(let l of[-1,1])r.add(C(n,1,.2),E.steel,e,s+8.5,i+l*5.4);let o=new Pt(Math.floor(e+i));for(let l=0;l<8;l++)Qe.rubblePile(r,e+o.range(-n/2,n/2),s,i+o.range(-7,7),o,o.range(1,3));for(let l=0;l<14;l++){let c=e+n/2+l*1.3,h=s+7*(1-l/14);r.add(C(1.35,.4,8),E.concrete,c,h-.2,i),r.collideBox(c-.67,h-.4,i-4,c+.67,h,i+4,"ramp")}}buildNest(t){let e=this.builder,{x:i,y:n,z:s,r}=t;e.add(Je(r,8),E.nest,i,n+.6,s,[0,0,0],{x:1.3,y:.6,z:1.3});for(let o=0;o<6;o++){let l=o/6*6.28;e.add(C(.22,r*.7,.22),E.nest,i+Math.cos(l)*r*.8,n+r*.3,s+Math.sin(l)*r*.8,[.2,l,.2])}this.addLoot(i,n+.6,s,"mutant","body"),this.hazards.push({type:"mutant",x:i,z:s,r:r+2,dps:.5})}materializeLights(){this.lights=[];for(let t of this.layout.lights){let e=new Ke(t.color,t.intensity,t.range,2);if(e.position.set(t.x,t.y,t.z),e.userData.base=t.intensity,e.userData.flicker=t.flicker,e.userData.fire=t.fire,e.userData.phase=Math.random()*10,this.scene.add(e),this.lights.push(e),this.lightPoints.push(t),t.fire){let i=new Kt;for(let n=0;n<5;n++){let s=new At(new ze(.5,.9),vt("radiation",{emissive:16742946,emissiveIntensity:2.6,transparent:!0,opacity:.8,side:_e,depthWrite:!1}));s.position.set(t.x+(Math.random()-.5)*.4,t.y+.3+n*.08,t.z+(Math.random()-.5)*.4),s.rotation.y=n*1.2,s.userData.fire=!0,i.add(s)}this.scene.add(i),this.fireGroups=this.fireGroups||[],this.fireGroups.push(i)}}}finalize(){let t=this.builder.finalize();this.staticInfo=t;for(let e of this.builder.colliders)this.colliders.addBox(e.minX,e.minY,e.minZ,e.maxX,e.maxY,e.maxZ,e.tag);this.builder.colliders.length=0;for(let e of this.trees)this.colliders.addBox(e.x-e.r,e.y,e.z-e.r,e.x+e.r,e.y+3,e.z+e.r,"tree");this.layout.loot.forEach(e=>this.lootSpots.push(e));for(let e of this.pois)e.discovered=!1;try{this.mapBitmap=this.buildMapBitmap()}catch(e){console.warn("map bitmap failed",e),this.mapBitmap=null}}buildMapBitmap(){let o=new Uint8ClampedArray(382976),l=new Float32Array(352*272),c=this.terrain;for(let g=0;g<272;g++){let y=-545+(g+.5)/272*1090;for(let p=0;p<352;p++){let m=-700+(p+.5)/352*1400;l[g*352+p]=c.heightAt(m,y)}}let h={suburbs:[70,73,56],forest:[48,60,44],industrial:[80,73,56],city:[66,69,67],military:[70,73,64],wasteland:[96,71,55]},d=(g,y)=>{let p=g*374761393+y*668265263^1542469173;return p=(p^p>>13)*1274126177,((p^p>>16)&1023)/1023-.5};for(let g=0;g<272;g++){let y=-545+(g+.5)/272*1090;for(let p=0;p<352;p++){let m=-700+(p+.5)/352*1400,x=(g*352+p)*4,v=g*352+p,b=l[v],_=l[v+(p<351?1:0)]-l[v-(p>0?1:0)],A=l[v+(g<271?352:0)]-l[v-(g>0?352:0)],T=Math.hypot(_,A)/8,k=qs(m,y),D=h[k.id]||[70,74,62],w=Math.min(1,Math.max(0,(T-.34)/.5)),M=D[0]*(1-w)+92*w,L=D[1]*(1-w)+89*w,U=D[2]*(1-w)+82*w,H=Math.max(.55,Math.min(1.42,1-(_*.85+A*.55)*.16));M*=H,L*=H,U*=H;let Y=Math.floor(b/8),B=Math.floor((b+Math.abs(_)+Math.abs(A)*.5+.001)/8);if(Y!==B&&(M*=.86,L*=.86,U*=.86),b<-2.45){let ht=Math.min(1,(-2.45-b)/6);M=62-ht*16,L=92-ht*18,U=98-ht*14}let et=c.roadDist(m,y).d;if(et<13){let ht=et<7?1:(13-et)/6,it=et<2.2?122:100,ct=et<2.2?118:97,Wt=et<2.2?104:88;M=M*(1-ht)+it*ht,L=L*(1-ht)+ct*ht,U=U*(1-ht)+Wt*ht}let q=d(p,g)*7;o[x]=M+q,o[x+1]=L+q,o[x+2]=U+q,o[x+3]=255}}let u=(g,y,p,m,x)=>(g-y)/(p-y)*(x-m)+m,f=(g,y,p,m,x,v,b)=>{let _=Math.cos(x),A=Math.sin(x),T=[[-p/2,-m/2],[p/2,-m/2],[p/2,m/2],[-p/2,m/2]].map(([L,U])=>[u(g+L*_+U*A,-700,700,0,352),u(y-L*A+U*_,-545,545,0,272)]),k=Math.max(0,Math.floor(Math.min(...T.map(L=>L[0])))),D=Math.min(351,Math.ceil(Math.max(...T.map(L=>L[0])))),w=Math.max(0,Math.floor(Math.min(...T.map(L=>L[1])))),M=Math.min(271,Math.ceil(Math.max(...T.map(L=>L[1]))));for(let L=w;L<=M;L++)for(let U=k;U<=D;U++){let H=U+.5-u(g,-700,700,0,352),Y=L+.5-u(y,-545,545,0,272),B=H*_-Y*A,et=H*A+Y*_;if(Math.abs(B)>p/2/(1400/352)||Math.abs(et)>m/2/(1090/272))continue;let q=(L*352+U)*4;o[q]=o[q]*(1-b)+v[0]*b,o[q+1]=o[q+1]*(1-b)+v[1]*b,o[q+2]=o[q+2]*(1-b)+v[2]*b}};for(let g of this.statics)g.type==="building"&&(f(g.x,g.z,g.w+1.2,g.d+1.2,g.ry,[38,36,32],.55),f(g.x,g.z,g.w,g.d,g.ry,[146,138,118],.5));for(let g of this.layout.camps){let y=u(g.x,-700,700,0,352),p=u(g.z,-545,545,0,272),m=Math.max(3,g.size*2.4/(1400/352));for(let x=Math.floor(p-m);x<=Math.ceil(p+m);x++)for(let v=Math.floor(y-m);v<=Math.ceil(y+m);v++){if(v<0||x<0||v>=352||x>=272)continue;let b=Math.hypot(v-y,x-p);if(b>m||b<m-1.1)continue;let _=(x*352+v)*4;o[_]=o[_]*.55+176*.45,o[_+1]=o[_+1]*.55+148*.45,o[_+2]=o[_+2]*.55+84*.45}}return{w:352,h:272,data:o,x0:-700,x1:700,z0:-545,z1:545}}update(t,e){this.time+=t;let i=this.time;if(this.lights)for(let n of this.lights){let s=n.userData.base;if(n.userData.fire)n.intensity=s*(.72+Math.sin(i*11+n.userData.phase)*.12+Math.sin(i*23.3+n.userData.phase*2)*.09+Math.random()*.06);else if(n.userData.flicker){let r=Math.sin(i*7.3+n.userData.phase)*Math.sin(i*3.1+n.userData.phase*1.7);n.intensity=s*(r>.35?.25:1)*(.9+Math.random()*.1)}}if(this.water)for(let n of this.water)n.material&&(n.material.roughness=.32+Math.sin(i*.7)*.03)}heightAt(t,e){return this.terrain.heightAt(t,e)}normalAt(t,e){return this.terrain.normalAt(t,e)}surfaceAt(t,e){return this.terrain.weightsAt(t,e).type}regionAt(t,e){return qs(t,e)}isIndoor(t,e,i){for(let n of this.statics)if(n.type==="building"&&!(Math.abs(t-n.x)>n.w*.6+2||Math.abs(i-n.z)>n.d*.6+2)&&e>n.y&&e<n.y+n.floors*3.4+.4)return!0;return!1}};function Og(a){let t=7;for(let e of a.id)t=t*31+e.charCodeAt(0)|0;return Math.abs(t)}function Fg(){let a=[];for(let i=0;i<3;i++){let n=new ze(1,.62);n.rotateY(i/3*Math.PI),n.translate(0,.31,0),a.push(n)}let{mergeGeometries:t}={mergeGeometries:Un};return Un(a.map(i=>i.toNonIndexed()),!1)}var Bg=`
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w; // push to far plane
}`,Hg=`
precision highp float;
varying vec3 vDir;
uniform vec3 topColor;
uniform vec3 horizonColor;
uniform vec3 groundColor;
uniform vec3 sunDir;
uniform vec3 sunColor;
uniform float sunSize;
uniform float haze;
uniform float time;
uniform float cloudCover;
uniform float starAmount;
uniform vec3 cloudColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col;
  if (h > 0.0) {
    float k = pow(smoothstep(0.0, 0.62, h), 0.72);
    col = mix(horizonColor, topColor, k);
  } else {
    col = mix(horizonColor * 0.86, groundColor, smoothstep(0.0, -0.28, h));
  }
  // sun disc + glow
  float sd = max(dot(d, sunDir), 0.0);
  col += sunColor * pow(sd, 9000.0) * 9.0;
  col += sunColor * pow(sd, 40.0) * 0.20 * (1.0 - haze);
  col += sunColor * pow(sd, 3.0) * 0.06;
  // horizon haze band
  float band = exp(-abs(h) * 9.0) * haze;
  col = mix(col, horizonColor * 1.06, band * 0.55);
  // clouds
  if (h > -0.02) {
    vec2 cp = d.xz / max(h + 0.14, 0.08) * 0.55 + vec2(time * 0.0035, time * 0.0022);
    float c = fbm(cp * 1.3);
    c = smoothstep(0.48 - cloudCover * 0.34, 0.78, c);
    float fade = smoothstep(-0.02, 0.22, h);
    col = mix(col, cloudColor, c * fade * 0.82);
  }
  // stars
  if (starAmount > 0.001 && h > 0.02) {
    vec2 sp = floor(d.xz / max(h, 0.05) * 140.0);
    float s = hash(sp);
    if (s > 0.9965) {
      float tw = 0.65 + 0.35 * sin(time * 2.0 + s * 90.0);
      col += vec3(0.85, 0.9, 1.0) * starAmount * tw * smoothstep(0.02, 0.3, h);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`,Zs={clear:{name:"Clear",fog:.0016,cloud:.28,rain:0,wind:.15,wet:0,haze:.35,light:1},overcast:{name:"Overcast",fog:.0034,cloud:.72,rain:0,wind:.35,wet:.15,haze:.6,light:.72},rain_light:{name:"Light Rain",fog:.0042,cloud:.8,rain:.35,wind:.45,wet:.6,haze:.7,light:.6},rain_heavy:{name:"Heavy Rain",fog:.0062,cloud:.94,rain:.9,wind:.8,wet:1,haze:.85,light:.45},storm:{name:"Thunderstorm",fog:.0075,cloud:1,rain:1,wind:1,wet:1,haze:.9,light:.32},fog:{name:"Dense Fog",fog:.014,cloud:.65,rain:.1,wind:.1,wet:.7,haze:1,light:.55},radstorm:{name:"Radiation Storm",fog:.011,cloud:.9,rain:.25,wind:1,wet:.3,haze:1,light:.4}},Ta=class{constructor(t,e){this.scene=t,this.renderer=e,this.time=0,this.dayTime=.34,this.dayLength=60*24,this.uniforms={topColor:{value:new mt(4876942)},horizonColor:{value:new mt(12106940)},groundColor:{value:new mt(2762272)},sunDir:{value:new P(.4,.8,.3)},sunColor:{value:new mt(16773336)},sunSize:{value:1},haze:{value:.4},time:{value:0},cloudCover:{value:.3},starAmount:{value:0},cloudColor:{value:new mt(9080982)}};let i=new Ei(1600,32,20),n=new Si({vertexShader:Bg,fragmentShader:Hg,uniforms:this.uniforms,side:Ze,depthWrite:!1,depthTest:!1,fog:!1});this.dome=new At(i,n),this.dome.frustumCulled=!1,this.dome.renderOrder=-1e3,t.add(this.dome),this.buildFarTerrain(),this.sunDir=new P(.4,.8,.3),this.weather="overcast",this.weatherTarget="overcast",this.weatherBlend={fog:Zs.overcast.fog,cloud:.72,rain:0,wind:.35,wet:.15,haze:.6,light:.72},this.lightning=0,this.lightningTimer=20,this.rain=this.buildRain(),this.starsVisible=0}buildFarTerrain(){for(let t=0;t<2;t++){let e=760+t*260,i=192,n=[],s=[],r=(h,d)=>{let u=Math.sin(h*2.1+d*1.7)*.5+.5,f=Math.sin(h*5.3+d*4.1+1.3)*.5+.5,g=Math.sin(h*11.7+d*9.7+2.6)*.5+.5,y=t===0?46:74,p=t===0?52:96;return y+(u*.58+f*.29+g*.13)*p};for(let h=0;h<=i;h++){let d=h/i*Math.PI*2,u=r(d,t),f=Math.cos(d)*e,g=Math.sin(d)*e,y=Math.cos(d)*(e+60),p=Math.sin(d)*(e+60);n.push(f,-40,g,y,u,p)}for(let h=0;h<i;h++){let d=h*2,u=h*2+1,f=h*2+2,g=h*2+3;s.push(d,f,u,u,f,g)}let o=new ke;o.setAttribute("position",new be(n,3)),o.setIndex(s);let l=new Ce({color:t===0?2896952:3818314,fog:!1,side:_e,depthWrite:!0}),c=new At(o,l);c.frustumCulled=!1,c.renderOrder=-900,this.scene.add(c),this.farRidges=this.farRidges||[],this.farRidges.push(c)}}buildRain(){let e=new Float32Array(18e3),i=new Float32Array(6e3);for(let o=0;o<6e3;o++)e[o*3]=(Math.random()-.5)*60,e[o*3+1]=Math.random()*26,e[o*3+2]=(Math.random()-.5)*60,i[o]=22+Math.random()*14;let n=new ke;n.setAttribute("position",new de(e,3));let s=new Os({color:11058376,size:.06,transparent:!0,opacity:0,sizeAttenuation:!0,depthWrite:!1,fog:!1}),r=new aa(n,s);return r.frustumCulled=!1,r.userData.vel=i,this.scene.add(r),r}setWeather(t,e=!1){if(Zs[t]&&(this.weather=t,this.weatherTarget=t,e)){let i=Zs[t];Object.assign(this.weatherBlend,i),this.weatherBlend.fog=i.fog,this.weatherBlend.cloud=i.cloud,this.weatherBlend.rain=i.rain,this.weatherBlend.wind=i.wind,this.weatherBlend.wet=i.wet,this.weatherBlend.haze=i.haze,this.weatherBlend.light=i.light}}get isNight(){return this.dayTime<.24||this.dayTime>.78}get hour(){return this.dayTime*24}update(t,e,i,n,s,r){this.time+=t,this.dayTime=(this.dayTime+t/this.dayLength)%1;let o=Zs[this.weatherTarget],l=1-Math.exp(-t*.12);this.weatherBlend.fog+=(o.fog-this.weatherBlend.fog)*l,this.weatherBlend.cloud+=(o.cloud-this.weatherBlend.cloud)*l,this.weatherBlend.rain+=(o.rain-this.weatherBlend.rain)*l,this.weatherBlend.wind+=(o.wind-this.weatherBlend.wind)*l,this.weatherBlend.wet+=(o.wet-this.weatherBlend.wet)*l,this.weatherBlend.haze+=(o.haze-this.weatherBlend.haze)*l,this.weatherBlend.light+=(o.light-this.weatherBlend.light)*l;let c=(this.dayTime-.25)*Math.PI*2,h=Math.sin(c),d=Math.cos(c);this.sunDir.set(d*.82,h,.42+d*.25).normalize();let u=xi(h*1.8+.22),f=xi(1-Math.abs(h)*5.5);this.dayAmt=u;let g=new mt(527640),y=new mt(1448998),p=new mt(4219532),m=new mt(11055800),x=new mt(2765648),v=new mt(12614226),b=g.clone().lerp(p,u),_=y.clone().lerp(m,u);f>.02&&(b.lerp(x,f*.55),_.lerp(v,f*.75));let A=this.weatherBlend;if(_.lerp(new mt(9212568),A.cloud*.5*u),b.lerp(new mt(5002332),A.cloud*.42*u),this.uniforms.topColor.value.copy(b),this.uniforms.horizonColor.value.copy(_),this.uniforms.groundColor.value.copy(_).multiplyScalar(.28),this.uniforms.sunDir.value.copy(this.sunDir),this.uniforms.sunColor.value.setRGB(1,.94,.84).lerp(new mt(16747072),f*.8),this.uniforms.haze.value=A.haze,this.uniforms.time.value=this.time,this.uniforms.cloudCover.value=A.cloud,this.uniforms.cloudColor.value.copy(_).multiplyScalar(.86).lerp(new mt(1777704),1-u),this.starsVisible=xi(1-u*2.2)*(1-A.cloud*.8),this.uniforms.starAmount.value=this.starsVisible,s&&(s.fog||(s.fog=new sa(9212568,.004)),s.fog.color.copy(_),s.fog.density=A.fog),i&&(i.position.copy(r).addScaledVector(this.sunDir,120),i.target.position.copy(r),i.target.updateMatrixWorld(),i.color.setRGB(1,.95,.88).lerp(new mt(16748624),f*.9),i.intensity=(.55+u*3)*A.light,i.castShadow=!0),n&&(n.color.copy(b).lerp(new mt(16777215),.15),n.groundColor.setRGB(.14,.12,.1).multiplyScalar(.6+u),n.intensity=.34+u*1.05+A.light*.2),e&&this.dome.position.copy(e.position),this.farRidges&&this.farRidges.forEach((T,k)=>{let D=k===0?.42:.6,w=_.clone().multiplyScalar(k===0?.4:.5);w.lerp(new mt(725014),.3+(1-u)*.45),w.lerp(_,A.cloud*.12*u),T.material.color.copy(w)}),this.rain){let T=this.rain.material;if(T.opacity=A.rain*.55,this.rain.visible=A.rain>.02,this.rain.visible&&r){let k=this.rain.geometry.attributes.position,D=this.rain.userData.vel,w=k.count,M=this.sunDir.x*A.wind*6;for(let L=0;L<w;L++){let U=k.getY(L)-D[L]*t,H=k.getX(L)+M*t,Y=k.getZ(L)+this.sunDir.z*A.wind*2*t;U<-2&&(U=24+Math.random()*6,H=(Math.random()-.5)*60,Y=(Math.random()-.5)*60),k.setXYZ(L,H,U,Y)}k.needsUpdate=!0,this.rain.position.set(r.x,r.y,r.z)}}if((this.weatherTarget==="storm"||this.weatherTarget==="radstorm")&&(this.lightningTimer-=t,this.lightningTimer<=0&&(this.lightning=1,this.lightningTimer=6+Math.random()*14)),this.lightning>0){this.lightning=Math.max(0,this.lightning-t*4.2);let T=this.lightning>.55?Math.random()>.4?1:.3:this.lightning*1.4;this.uniforms.topColor.value.addScalar(T*.5),this.uniforms.horizonColor.value.addScalar(T*.6),n&&(n.intensity+=T*2.2),i&&(i.intensity+=T*1.6)}return{dayAmt:u,twilight:f}}get fogDensity(){return this.weatherBlend.fog}get wetness(){return this.weatherBlend.wet}get wind(){return this.weatherBlend.wind}get rainAmount(){return this.weatherBlend.rain}get weatherName(){return Zs[this.weatherTarget].name}};var Aa=class{constructor(t,e={}){this.world=t,this.cfg=ys.player,this.pos=new P().copy(t.startPosition),this.vel=new P,this.yaw=0,this.pitch=0,this.bodyYaw=0,this.height=this.cfg.height,this.crouching=!1,this.sprinting=!1,this.grounded=!0,this.aiming=!1,this.cameraMode=0,this.camDist=3.6,this.camDistTarget=3.6,this.camPos=new P,this.camHeight=1.55,this.bob=0,this.bobPhase=0,this.sens=1,this.fov=72,this.shake=0,this.shakeSeed=Math.random()*100,this.stamina=100,this.staminaMax=100,this.stats={health:100,healthMax:100,hunger:100,thirst:100,temp:60,radiation:0,infection:0,bleed:0,stress:0,fatigue:0,stamina:100,staminaMax:100,fractures:{head:!1,torso:!1,arms:!1,legs:!1}},this.footstepTimer=0,this.lastSurface="grass",this.noise=0,this.flashlightOn=!0,this.flashlightBattery=100,this.moving=!1,this.speed=0,this.landTimer=0,this.notify=()=>{},this.skills={},this.sprintDrain=1,this.damageMul=1,this.armorValue=0,this.armorRadRes=0,this._tmp=new P,this._colliderHit=[],this.dead=!1}get position(){return this.pos}get velocity(){return this.vel}get eyePos(){return new P(this.pos.x,this.pos.y+this.camHeight-(this.crouching?.25:0),this.pos.z)}get forward(){return new P(-Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch))}get flatForward(){return new P(-Math.sin(this.yaw),0,-Math.cos(this.yaw))}get flatRight(){return new P(Math.cos(this.yaw),0,-Math.sin(this.yaw))}input(t,e,i){if(e.dx||e.dy){let r=.0022*this.sens*(this.aiming?.65:1);this.yaw-=e.dx*r,this.pitch-=e.dy*r,this.pitch=Z(this.pitch,-1.45,1.35)}let n=(t.KeyW?1:0)-(t.KeyS?1:0),s=(t.KeyD?1:0)-(t.KeyA?1:0);this.wish=new Xt(s,n),this.wantSprint=!!t.ShiftLeft&&n>0&&!this.aiming,this.wantCrouch=!!t.KeyC||!!t.ControlLeft}update(t,e,i){if(this.dead)return;let n=this.cfg,s=this.world.terrain;this.sprintDrain=1+(this.skills?.sprint||0),this.sprinting&&this.grounded&&this.stamina>0?(this.stamina-=n.staminaDrain*t*this.sprintDrain,this.stamina<=0&&(this.stamina=0,this.sprinting=!1),this.staminaDelay=1):(this.staminaDelay=Math.max(0,(this.staminaDelay||0)-t),this.staminaDelay<=0&&(this.stamina=Math.min(this.staminaMax,this.stamina+n.staminaRegen*t*(this.crouching?1.5:1)))),this.stats.stamina=this.stamina;let r=this.crouching?n.crouchHeight:n.height;this.height=He(this.height,r,12,t),this.camHeight=He(this.camHeight,this.crouching?n.eyeHeight-.42:n.eyeHeight,12,t);let o=this.wish||new Xt,l=o.length(),c=n.walkSpeed;this.crouching?c=n.crouchSpeed:this.sprinting&&(c=n.sprintSpeed),this.aiming&&(c=n.adsSpeed),this.stats.bleed>30&&(c*=.85),this.stats.fractures.legs&&(c*=.62),this.stats.fatigue>60&&(c*=.9),this.stats.health<25&&(c*=.88),this.waterDepth>.9&&(c*=.62);let h=this.wantSprint&&l>0&&this.stamina>2&&!this.crouching;this.sprinting=h;let d=new P;if(l>0){let p=this.flatForward.multiplyScalar(o.y),m=this.flatRight.multiplyScalar(o.x);d.copy(p).add(m).normalize().multiplyScalar(c)}let u=this.grounded?n.accel:n.airAccel;this.vel.x=He(this.vel.x,d.x,u,t),this.vel.z=He(this.vel.z,d.z,u,t);let f=this.getWaterLevel();this.waterDepth=f!==null?f-this.pos.y:0,this.waterDepth>1.2?(this.vel.y=He(this.vel.y,(f-1.15-this.pos.y)*3.2,6,t),this.grounded=!1):(this.vel.y+=n.gravity*t,this.waterDepth>.2&&(this.vel.y*=.86)),(e.Space||e.KeySpace)&&this.grounded&&this.stamina>8&&(this.vel.y=n.jumpVel,this.grounded=!1,this.stamina-=8,this.staminaDelay=.8,this.jumpPressed=!1),this.moveWithCollision(t);let g=this.groundHeightAt(this.pos.x,this.pos.z);this.pos.y<=g+.02?(!this.grounded&&this.vel.y<-6&&(this.landTimer=.18),this.pos.y=g,this.vel.y=0,this.grounded=!0):this.pos.y<g?(this.pos.y=g,this.grounded=!0,this.vel.y=0):this.grounded=!1,this.stepUp(),this.updateCamera(t,i);let y=Math.hypot(this.vel.x,this.vel.z);this.speed=y,this.moving=y>.4,this.noise=this.sprinting?1:this.crouching?.12:this.moving?.45:.05,this.grounded&&this.moving&&(this.footstepTimer-=t*(this.sprinting?1.55:this.crouching?.6:1),this.footstepTimer<=0&&(this.footstepTimer=.46,this.lastSurface=this.world.surfaceAt(this.pos.x,this.pos.z),i&&i.audio&&i.audio.footstep(this.lastSurface,this.sprinting?1:.6)),this.bobPhase+=t*(this.sprinting?13:8.5)),this.landTimer=Math.max(0,this.landTimer-t),this.shake=Math.max(0,this.shake-t*2.2),this.flashlightOn&&(this.flashlightBattery=Math.max(0,this.flashlightBattery-t*.11))}getWaterLevel(){let t=this.world.terrain;return Math.hypot(this.pos.x-t.lake.x,this.pos.z-t.lake.z)<t.lake.r*1.05?t.lake.level:t.riverDist(this.pos.x,this.pos.z)<14?-3.1:null}groundHeightAt(t,e){let i=this.world.heightAt(t,e),n=this.pos.y<i-.8,s=this.world.colliders.query(t-.35,e-.35,t+.35,e+.35,this._floorCols||(this._floorCols=[])),r=null;for(let o of s)o.tag!=="floor"&&o.tag!=="stairs"&&o.tag!=="ramp"||o.maxY>this.pos.y+.45||(r===null||o.maxY>r)&&(r=o.maxY);return n?r!==null?r:this.pos.y:r!==null&&r>i+.02&&r<this.pos.y+.45?r:i}moveWithCollision(t){let e=this.cfg.radius,i=this.pos.y,n=this.pos.y+this.height,s=this.world.colliders.query(this.pos.x-e-2,this.pos.z-e-2,this.pos.x+e+2,this.pos.z+e+2),r=(c,h,d)=>{let u=this.pos.x+c,f=this.pos.y+h,g=this.pos.z+d;if(h!==0){for(let p of s)u+e<=p.minX||u-e>=p.maxX||g+e<=p.minZ||g-e>=p.maxZ||(h>0?n+h>p.minY&&i<p.maxY&&(f=Math.min(f,p.minY-this.height-.001),this.vel.y=0):i+h<p.maxY&&n>p.minY&&(f=Math.max(f,p.maxY+.001),this.vel.y=0,this.grounded=!0));return this.pos.y=f,!0}let y=!1;for(let p of s){if(p.tag==="floor"||p.tag==="stairs"||p.tag==="ramp"||i+.35>=p.maxY||n-.15<=p.minY)continue;let m=Z(u,p.minX,p.maxX),x=Z(g,p.minZ,p.maxZ),v=u-m,b=g-x;if(v*v+b*b<e*e){let _=(e-Math.abs(v))*(v>=0?1:-1),A=(e-Math.abs(b))*(b>=0?1:-1);Math.abs(_)<Math.abs(A)?u+=_:g+=A,y=!0}}return this.pos.x=u,this.pos.z=g,!y},o=Math.max(1,Math.ceil((Math.abs(this.vel.x)+Math.abs(this.vel.z)+Math.abs(this.vel.y))*t/.28)),l=t/o;for(let c=0;c<o;c++)r(0,this.vel.y*l,0),r(this.vel.x*l,0,0),r(0,0,this.vel.z*l);this.pos.x=Z(this.pos.x,-690,690),this.pos.z=Z(this.pos.z,-490,490)}stepUp(){if(!this.grounded)return;let t=this.cfg.radius,e=this.world.colliders.query(this.pos.x-t,this.pos.z-t,this.pos.x+t,this.pos.z+t);for(let i of e)if(["floor","stairs","ramp","prop","debris"].includes(i.tag)&&i.maxY>this.pos.y+.02&&i.maxY<this.pos.y+.62){let n=Z(this.pos.x,i.minX,i.maxX),s=Z(this.pos.z,i.minZ,i.maxZ);Math.hypot(this.pos.x-n,this.pos.z-s)<t*.95&&(this.pos.y=i.maxY+.01)}}updateCamera(t,e){let i=new P(this.pos.x,this.pos.y+this.camHeight,this.pos.z),n=(this.moving&&this.grounded?this.sprinting?1.3:.8:0)*(this.aiming?.25:1),s=Math.sin(this.bobPhase*2)*.022*n,r=Math.cos(this.bobPhase)*.026*n;i.y+=s+(this.landTimer>0?-.06*(this.landTimer/.18):0),this.aiming=!!(e&&e.input.mouse.right);let o=this.aiming?this.fov-14:this.sprinting?this.fov+5:this.fov;e&&e.camera&&(e.camera.fov=He(e.camera.fov,o,8,t));let l=this.forward,c=new P().crossVectors(new P(0,1,0),l).normalize();if(this.cameraMode===1){let h=i.clone().addScaledVector(c,r);this.camPos.copy(h),e&&e.camera&&(e.camera.position.copy(h),e.camera.rotation.set(this.pitch,this.yaw,Math.sin(this.bobPhase)*.004*n,"YXZ")),this.camDist=0}else{let d=i.clone().addScaledVector(c,.62*(this.aiming?1:.8)),u=this.aiming?1.5:3.4;this.camDistTarget=u,this.camDist=He(this.camDist,this.camDistTarget,9,t);let f=d.clone().addScaledVector(l,-this.camDist).addScaledVector(c,r*.5);f.y+=s*.5;let g=f.clone().sub(d),y=g.length();if(y>.01){g.normalize();let m=this.world.colliders.raycast(d.x,d.y,d.z,g.x,g.y,g.z,y+.4);m&&m.dist<y&&f.copy(d).addScaledVector(g,Math.max(.35,m.dist-.35))}let p=this.world.heightAt(f.x,f.z)+.4;if(f.y<p&&p-f.y<3&&(f.y=p),this._camSmooth||(this._camSmooth=f.clone()),this._camSmooth.lerp(f,1-Math.exp(-t*22)),e&&e.camera){e.camera.position.copy(this._camSmooth);let m=d.clone().addScaledVector(l,14);e.camera.lookAt(m),e.camera.rotateZ(Math.sin(this.bobPhase)*.008*n)}}if(e&&e.camera&&this.shake>.001){let h=this.shake*this.shake;e.camera.position.x+=Math.sin(this.shakeSeed+e.time*61)*.06*h,e.camera.position.y+=Math.cos(this.shakeSeed+e.time*47)*.06*h,e.camera.rotateZ(Math.sin(this.shakeSeed+e.time*39)*.02*h)}}addShake(t,e){this.shake=Math.min(1.4,this.shake+t)}updateSurvival(t,e){let i=this.stats,n=ys.survival,s=this.skills||{},r=s.consumeRate||1,o=e?.temperature??12,l=this.world.isIndoor(this.pos.x,this.pos.y+1,this.pos.z);i.hunger=Z(i.hunger-n.hungerRate*r*t*(this.sprinting?1.35:1),0,100),i.thirst=Z(i.thirst-n.thirstRate*r*t*(this.sprinting?1.5:1),0,100);let c=l?Rt(o,18,.8):o,h=s.resistEnv?1-s.resistEnv:1;i.temp=He(i.temp,c,.12*(l?2.5:1),t),this.cold=i.temp<22;let d=this.world.regionAt(this.pos.x,this.pos.z),u=0;for(let p of this.world.hazards){if(p.type!=="radiation")continue;let m=Math.hypot(this.pos.x-p.x,this.pos.z-p.z);m<p.r&&(u+=(1-m/p.r)*.9)}d.id==="wasteland"&&(u+=.015);let f=1-(this.armorRadRes||0);i.radiation=Z(i.radiation+u*f*h*t,0,100),i.bleed>0&&(i.bleed=Z(i.bleed-t*.35,0,100),i.health=Z(i.health-i.bleed*.0016*t*(s.bleedResist?1-s.bleedResist:1),0,i.healthMax)),i.infection=Z(i.infection+n.infectRate*(i.bleed>20?3:1)*t,0,100);let g=-.4;d.danger>=4&&(g+=.25),!this.flashlightOn&&e?.night&&(g+=.5),i.health<35&&(g+=.6),e?.nearbyEnemies&&(g+=e.nearbyEnemies*.35),i.stress=Z(i.stress+g*t,0,100);let y=0;i.hunger<=0&&(y+=n.hungerDmg*t),i.thirst<=0&&(y+=n.thirstDmg*t),i.temp<12&&(y+=n.coldDmg*t*(1-i.temp/12)),i.radiation>65&&(y+=n.radDmg*t*((i.radiation-65)/35)),i.infection>75&&(y+=.05*t),y>0&&(i.health=Z(i.health-y,0,i.healthMax)),i.stress>92&&(i.health=Z(i.health-.02*t,0,i.healthMax)),this.staminaMax=i.staminaMax*(1-i.fatigue/260),i.stamina>this.staminaMax&&(this.stamina=this.staminaMax)}applyDamage(t,e={}){if(this.dead)return;let i=(this.armorValue||0)*(1-(e.penetration||0)),n=Math.max(1,t-i*(e.body==="torso"?1:.6));return this.stats.health=Z(this.stats.health-n,0,this.stats.healthMax),this.addShake(Z(n/45,.05,.9)),e.bleed&&(this.stats.bleed=Z(this.stats.bleed+e.bleed,0,100)),e.infection&&(this.stats.infection=Z(this.stats.infection+e.infection,0,100)),e.radiation&&(this.stats.radiation=Z(this.stats.radiation+e.radiation,0,100)),e.fracture&&(this.stats.fractures[e.body||"legs"]=!0),this.stats.health<=0&&(this.dead=!0),n}heal(t){this.stats.health=Z(this.stats.health+t,0,this.stats.healthMax)}respawn(t){this.dead=!1,this.stats.health=this.stats.healthMax*.6,this.stats.bleed=0,this.pos.copy(t),this.vel.set(0,0,0)}};var $t={IDLE:"idle",PATROL:"patrol",ALERT:"alert",CHASE:"chase",ATTACK:"attack",STAGGER:"stagger",FLEE:"flee",DEAD:"dead",BURROW:"burrow",EMERGE:"emerge"},bc=new Map;function Ie(a,t,e,i){let n=a+t+"|"+e+"|"+i;if(bc.has(n))return bc.get(n);let s;return a==="box"?s=C(t,e,i,1.4):a==="cyl"?s=rt(t,e,i,8,1.4):s=Je(t,10,1.4),bc.set(n,s),s}function Ks(a,t,e,i,n,s,r,o=1){let l=new Kt;if(l.position.set(t,e,i),a.add(l),n>0){let c=new At(Ie("cyl",s,n,s),r);c.position.y=-n/2,c.castShadow=!0,c.receiveShadow=!0,c.userData.texName=r.userData.texName,l.add(c);let h=new At(Ie("sph",s*1.15,0,0),r);h.position.y=-n,h.castShadow=!0,h.userData.texName=r.userData.texName,l.add(h)}return l}function Vg(a,t={}){let e=Ti[a]||Ti.hollow,i=vt(e.skin||"flesh",{color:t.tint||16777215}),n=vt("flesh",{color:t.darkTint||11575456}),s=vt("paper",{color:13156522}),r=ye(t.eyeColor||new mt(e.eyes||"#c9d8a0").getHex(),{emissive:new mt(e.eyes||"#c9d8a0").getHex(),emissiveIntensity:t.eyeGlow??1.6,roughness:.4}),o=new Kt,l={root:o,skin:i,eyeMat:r},c=e.scale||1,h={},d=(f,g,y,p,m,x,v)=>{let b=new At(g,y);return b.position.set(p,m,x),v&&b.rotation.set(v[0]||0,v[1]||0,v[2]||0),b.castShadow=!0,b.receiveShadow=!0,b.userData.texName=y.userData.texName,f.add(b),b},u=e.build;if(u==="humanoid"||u==="tall"||u==="bloated"||u==="brute"){let f=u==="tall",g=u==="bloated",y=u==="brute",p=y?1.5:g?1.4:f?1.25:1.1,m=y?1.5:g?1.45:f?.75:.72,x=y?.9:g?1.2:.55,v=y?1.1:g?.95:.92,b=y?1.05:g?.82:.92,_=y?1.15:f?1.35:.85,A=d(o,Ie("box",m*.85,.42,x*.85),i,0,v,0),T=new Kt;T.position.set(0,v+.12,0),o.add(T),d(T,Ie("box",m,p,x),i,0,p/2,0);for(let L=0;L<3;L++)d(T,Ie("box",m*.96,.06,x*1.02),n,0,p*.35+L*p*.2,0);h.torso=T;let k=p*.88,D=m*.52;h.armL=Ks(T,-D,k,0,_,y?.24:f?.13:.11,i,-1),h.armR=Ks(T,D,k,0,_,y?.24:f?.13:.11,i,1);for(let[L,U]of[["armL",-1],["armR",1]]){let H=h[L],Y=new Kt;Y.position.y=-_,H.add(Y);for(let B=0;B<3;B++){let et=d(Y,Ie("cyl",.035,.28,.035),s,(B-1)*.07,-.13,.03,[.2,0,(B-1)*.22])}h[L+"Hand"]=Y}let w=new Kt;w.position.set(0,p+.06,f?-.06:0),T.add(w),d(w,Ie("sph",y?.3:.19,0,0),i,0,.13,0),d(w,Ie("box",y?.34:.22,.1,.22),n,0,.02,.06);for(let L of[-1,1])d(w,Ie("sph",.035,0,0),r,L*.075,.15,.155);h.head=w;let M=m*.26;h.legL=Ks(o,-M,v,0,b,y?.2:.12,i,-1),h.legR=Ks(o,M,v,0,b,y?.2:.12,i,1);for(let L of["legL","legR"])d(h[L],Ie("box",.16,.09,.3),n,0,-b,.07);if(h.baseY=-(v+b),y)for(let L=0;L<4;L++)d(T,Ie("box",m*.5,.18,x*.4),vt("armor"),L%2?.2:-.2,p*.3+L*.28,-x*.45,[.2,0,0]);if(g)for(let L=0;L<5;L++){let U=L/5*6.28;d(T,Ie("sph",.26,0,0),vt("radiation",{emissive:8978278,emissiveIntensity:.8}),Math.cos(U)*m*.5,p*(.3+L%3*.18),Math.sin(U)*x*.5)}if(f){d(T,Ie("cyl",.09,.6,.09),i,0,p+.05,0),h.head.position.y+=.42;for(let L=0;L<5;L++)d(T,Ie("box",.04,.5,.04),s,(L-2)*.09,.2,-x*.55,[.4,0,0])}}else if(u==="quadruped"){d(o,Ie("box",.62,.55,1.25),i,0,.72,0),d(o,Ie("sph",.42,0,0),i,0,.72+.12,-1.25*.42);for(let x=0;x<5;x++)d(o,Ie("box",.06,.22,.08),s,0,.72+.55*.55,-1.25*.35+x*.16,[.3,0,0]);let p=new Kt;p.position.set(0,.72+.08,1.25*.5),o.add(p),d(p,Ie("sph",.2,0,0),i,0,0,.08,[0,0,0]),d(p,Ie("box",.16,.12,.26),n,0,-.04,.24);for(let x of[-1,1])d(p,Ie("sph",.04,0,0),r,x*.08,.06,.2);h.head=p;let m=[[-.28,1.25*.34],[.28,1.25*.34],[-.28,-1.25*.34],[.28,-1.25*.34]];h.legs=[],m.forEach(([x,v],b)=>{let _=new Kt;_.position.set(x,.72-.55*.4,v),o.add(_);let A=Ks(_,0,0,0,.34,.09,i);A.rotation.z=x>0?-.35:.35,d(A,Ie("box",.12,.08,.26),n,0,-.36,.06),h.legs.push(_)}),h.baseY=-.72,h.torso=null}return o.scale.setScalar(c),l.bones=h,l.def=e,l}var Js=class{constructor(t,e,i,n,s={}){this.game=t,this.type=e,this.def=Ti[e],this.isBoss=!1,this.rng=new Pt(Math.floor(i*977+n*131+Math.random()*1e6)>>>0);let r=t.world.heightAt(i,n);this.pos=new P(i,r,n),this.home=new P(i,r,n),this.vel=new P,this.yaw=this.rng.range(0,6.28),this.hpMax=(s.hp??this.def.hp)*(t.difficulty||1),this.hp=this.hpMax,this.state=$t.IDLE,this.stateTime=0,this.attackCooldown=0,this.target=null,this.lastKnown=new P(i,r,n),this.alertTime=0,this.searchTime=0,this.animT=this.rng.range(0,10),this.speedMul=s.speedMul??1,this.aggro=0,this.stuckTimer=0,this.lastPos=new P().copy(this.pos),this.perceptionTimer=this.rng.range(0,.3),this.hitFlash=0,this.groundY=r,this.dead=!1,this.deadTime=0,this.attackAnim=0,this.chargeDir=null,this.burrowed=!1,this.aura=0,this.callTimer=0,this.parts=Vg(e,s),this.parts.root.position.copy(this.pos),t.scene.add(this.parts.root),this.radius=.42*(this.def.scale||1),this.height=(this.def.build==="quadruped"?.9:1.85)*(this.def.scale||1),this.noise=0,this.flinch=0}dispose(){this.game.scene.remove(this.parts.root),this.parts.root.traverse(t=>{t.isMesh&&t.material&&t.material.userData&&t.material.userData.__owned&&t.material.dispose()})}get alive(){return!this.dead}get center(){return new P(this.pos.x,this.pos.y+this.height*.55,this.pos.z)}canSee(t,e){let i=this.pos.distanceTo(t.pos);if(i>e)return!1;let n=new P(t.pos.x-this.pos.x,0,t.pos.z-this.pos.z).normalize(),s=new P(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),r=n.dot(s),l=this.game.sky.isNight?.4:this.def.build==="quadruped"?.1:.35;if(r<l&&i>4)return!1;let c=this.center,d=new P(t.pos.x,t.pos.y+1.3,t.pos.z).clone().sub(c),u=d.length();d.normalize();let f=this.game.world.colliders.raycast(c.x,c.y,c.z,d.x,d.y,d.z,u);return!(f&&f.dist<u-.6)}hear(t,e,i){if(this.dead)return;let n=Math.hypot(e-this.pos.x,i-this.pos.z),s=(this.def.hearing||20)*t;n<s&&(this.lastKnown.set(e,this.pos.y,i),(this.state===$t.IDLE||this.state===$t.PATROL)&&(this.setState($t.ALERT),this.alertTime=0,this.game.audio.enemyAlert(this.type,this.pos)))}setState(t){this.state!==t&&(this.state=t,this.stateTime=0)}update(t){if(this.dead){this.updateDeath(t);return}this.stateTime+=t,this.animT+=t,this.attackCooldown=Math.max(0,this.attackCooldown-t),this.hitFlash=Math.max(0,this.hitFlash-t*4),this.flinch=Math.max(0,this.flinch-t*3);let e=this.game.player,i=Math.hypot(e.pos.x-this.pos.x,e.pos.z-this.pos.z);if(this.perceptionTimer-=t,this.perceptionTimer<=0){if(this.perceptionTimer=.22+this.rng.next()*.16,!e.dead&&this.canSee(e,this.def.sight||25)){let s=e.crouching?.55:e.sprinting?1.35:1;this.aggro+=t+.25*s,this.lastKnown.copy(e.pos),(this.state===$t.IDLE||this.state===$t.PATROL||this.state===$t.ALERT)&&this.aggro>.35&&(this.setState($t.CHASE),this.game.audio.enemyAlert(this.type,this.pos),this.game.onEnemyAggro(this))}else this.aggro=Math.max(0,this.aggro-.25*t-.02);e.noise>.2&&this.hear(e.noise,e.pos.x,e.pos.z)}switch(this.state){case $t.IDLE:this.idle(t,i);break;case $t.PATROL:this.patrol(t);break;case $t.ALERT:this.alert(t);break;case $t.CHASE:this.chase(t,i);break;case $t.ATTACK:this.attack(t,i);break;case $t.STAGGER:this.stagger(t);break;case $t.FLEE:this.flee(t);break;case $t.BURROW:this.burrow(t,i);break;case $t.EMERGE:this.emerge(t);break}this.applyMovement(t),this.animate(t),this.parts.root.position.copy(this.pos),this.parts.root.rotation.y=this.yaw,this.def.radioactive&&(this.aura+=t,this.aura>1&&(this.aura=0,i<6&&(e.stats.radiation=Z(e.stats.radiation+3.5,0,100))))}idle(t){if(this.vel.multiplyScalar(.9),this.rng.chance(t*.08)){this.setState($t.PATROL);let e=this.rng.range(0,6.28),i=this.rng.range(4,14);this.patrolTarget=new P(this.home.x+Math.cos(e)*i,this.home.y,this.home.z+Math.sin(e)*i)}this.idleYaw=(this.idleYaw||0)+t*.2,this.yaw=Nn(this.yaw,this.idleYaw+Math.sin(this.animT*.4)*.6,1.5,t)}patrol(t){if(!this.patrolTarget){this.setState($t.IDLE);return}if(Math.hypot(this.patrolTarget.x-this.pos.x,this.patrolTarget.z-this.pos.z)<1.2){this.setState($t.IDLE);return}this.moveToward(this.patrolTarget,(this.def.speed||3)*.45,t),this.stateTime>12&&this.setState($t.IDLE)}alert(t){this.vel.multiplyScalar(.88),this.alertTime+=t;let e=this.lastKnown.clone().sub(this.pos),i=Math.atan2(-e.x,-e.z);this.yaw=Nn(this.yaw,i,4,t),this.alertTime>2.2&&this.setState($t.CHASE),this.lookUp=Math.sin(this.alertTime*3)*.1}chase(t,e){let i=this.game.player,n=(this.def.sight||25)*1.6;this.stateTime%.5<t&&this.canSee(i,n)&&this.lastKnown.copy(i.pos);let s=this.lastKnown,r=this.def.atkRange||2,o=Math.hypot(s.x-this.pos.x,s.z-this.pos.z);if(this.def.burrow&&!this.burrowed&&o>6&&o<22&&this.rng.chance(t*.5)){this.setState($t.BURROW);return}this.def.ranged?(o<9-1.5?this.moveToward(this.pos.clone().add(this.pos.clone().sub(s).setY(this.pos.y)),this.def.speed,t):o>11?this.moveToward(s,this.def.speed,t):(this.vel.multiplyScalar(.86),this.faceTarget(s,t)),this.attackCooldown<=0&&o<24&&this.hasLineOfSight(s)&&this.startAttack("ranged")):this.def.name==="Brute"?o<14&&this.attackCooldown<=0&&this.rng.chance(t*.7)?this.startAttack("charge"):o<r?this.startAttack("melee"):this.moveToward(s,this.def.speed*this.speedMul,t):o<r?(this.vel.multiplyScalar(.8),this.faceTarget(s,t),this.attackCooldown<=0&&this.startAttack("melee")):this.moveToward(s,this.def.speed*this.speedMul*(this.def.stealth?1.05:1),t),this.stateTime>24&&o>30&&(this.setState($t.FLEE),this.aggro=0),this.def.stealth&&o<12&&this.game.player.forward.dot(new P(this.pos.x-i.pos.x,0,this.pos.z-i.pos.z).normalize())>.85&&this.rng.chance(t*.5)&&this.setState($t.FLEE),this.type==="screamer"&&(this.callTimer-=t,this.callTimer<=0&&(this.callTimer=8,this.scream()))}hasLineOfSight(t){let e=this.center,n=new P(t.x,this.pos.y+1.2,t.z).clone().sub(e),s=n.length();n.normalize();let r=this.game.world.colliders.raycast(e.x,e.y,e.z,n.x,n.y,n.z,s);return!r||r.dist>s-1}scream(){this.game.audio.scream(this.pos),this.game.spawnShockwave(this.pos,16,6750122);for(let t of this.game.enemies)t===this||t.dead||Math.hypot(t.pos.x-this.pos.x,t.pos.z-this.pos.z)<32&&(t.lastKnown.copy(this.game.player.pos),t.setState($t.CHASE));this.game.onEnemyAggro(this)}faceTarget(t,e){let i=t.clone().sub(this.pos),n=Math.atan2(-i.x,-i.z);this.yaw=Nn(this.yaw,n,7,e)}startAttack(t){this.setState($t.ATTACK),this.attackKind=t,this.attackCooldown=1/(this.def.atkRate||1)+.35,this.attackAnim=0,this.attackHit=!1,t==="charge"?(this.chargeDir=this.game.player.pos.clone().sub(this.pos).setY(0).normalize(),this.game.audio.enemyGrowl(this.type,this.pos)):t==="ranged"&&this.game.audio.enemyGrowl(this.type,this.pos)}attack(t,e){let i=this.game.player,n=Math.hypot(i.pos.x-this.pos.x,i.pos.z-this.pos.z);this.faceTarget(i.pos,t),this.attackAnim+=t;let s=this.attackKind==="ranged"?.55:.42,r=(this.def.atkRange||2)+.6;if(this.attackKind==="charge"){this.attackAnim>.35&&this.chargeDir&&(this.vel.x=this.chargeDir.x*11,this.vel.z=this.chargeDir.z*11,n<r+.6&&!this.attackHit&&(this.attackHit=!0,this.hitPlayer(this.def.dmg*1.6,{fracture:this.rng.chance(.25),body:"legs"}),i.addShake(.4),this.game.audio.impactHard(this.pos))),this.attackAnim>.9&&(this.chargeDir=null,this.setState($t.CHASE));return}if(this.attackKind==="ranged"){this.attackAnim>s&&!this.attackHit&&(this.attackHit=!0,this.game.spawnProjectile(this.center,i.eyePos.clone().add(new P(0,-.35,0)),{speed:26,damage:this.def.dmg,owner:"enemy",color:10148095,radius:.16,onHit:()=>this.game.audio.impactHard(this.pos)})),this.attackAnim>s+.5&&this.setState($t.CHASE);return}this.attackAnim>s&&!this.attackHit&&(this.attackHit=!0,n<r&&(this.hitPlayer(this.def.dmg,{bleed:this.rng.range(3,12),body:this.rng.pick(["torso","arms","legs","head"])}),this.type==="contaminated"&&(i.stats.radiation=Z(i.stats.radiation+6,0,100)))),this.attackAnim>s+.55&&this.setState($t.CHASE)}hitPlayer(t,e){let i=this.game.player.applyDamage(t,e);this.game.audio.hitBody(this.pos),this.game.vfx.bloodBurst(this.game.player.pos.clone().add(new P(0,1.2,0)),this.game.player.forward.clone().negate()),this.game.onPlayerHurt(i)}stagger(t){this.vel.multiplyScalar(.82),this.stateTime>.5&&this.setState($t.CHASE)}flee(t){let e=this.pos.clone().sub(this.game.player.pos).setY(0).normalize();this.vel.x=He(this.vel.x,e.x*(this.def.speed||3)*1.1,6,t),this.vel.z=He(this.vel.z,e.z*(this.def.speed||3)*1.1,6,t),this.stateTime>6&&(this.aggro=0,this.setState($t.IDLE))}burrow(t,e){if(this.burrowed=!0,this.parts.root.visible=!1,this.vel.multiplyScalar(.9),this.stateTime>1.2){let i=this.rng.range(0,6.28),n=this.rng.range(2.5,5);this.pos.set(this.game.player.pos.x+Math.cos(i)*n,this.pos.y,this.game.player.pos.z+Math.sin(i)*n),this.pos.y=this.game.world.heightAt(this.pos.x,this.pos.z),this.setState($t.EMERGE),this.game.audio.enemyGrowl(this.type,this.pos),this.game.vfx.dustBurst(this.pos,18)}}emerge(t){this.parts.root.visible=!0,this.stateTime>.5&&(this.burrowed=!1,this.setState($t.CHASE))}moveToward(t,e,i){let n=t.x-this.pos.x,s=t.z-this.pos.z,r=Math.hypot(n,s);if(r<.001)return;let o=n/r,l=s/r,c=1.8,h=(f,g)=>{let y=this.pos.x+f,p=this.pos.z+g;return!this.game.world.colliders.raycast(this.pos.x,this.pos.y+.9,this.pos.z,f,0,g,c)};if(!h(o*c,l*c)){let f=[o*Math.cos(.9)-l*Math.sin(.9),o*Math.sin(.9)+l*Math.cos(.9)],g=[o*Math.cos(-.9)-l*Math.sin(-.9),o*Math.sin(-.9)+l*Math.cos(-.9)];h(f[0]*c,f[1]*c)?(o=f[0],l=f[1]):h(g[0]*c,g[1]*c)?(o=g[0],l=g[1]):(o=-o,l=-l)}this.vel.x=He(this.vel.x,o*e,7,i),this.vel.z=He(this.vel.z,l*e,7,i);let d=Math.atan2(-o,-l);this.yaw=Nn(this.yaw,d,6,i),Math.hypot(this.pos.x-this.lastPos.x,this.pos.z-this.lastPos.z)<.02*(i*60)?this.stuckTimer+=i:this.stuckTimer=0,this.stuckTimer>1.2&&(this.yaw+=this.rng.range(1.5,3.6),this.stuckTimer=0,this.rng.chance(.3)&&this.setState($t.CHASE)),this.lastPos.copy(this.pos)}applyMovement(t){let e=this.pos.x+this.vel.x*t,i=this.pos.z+this.vel.z*t,n=this.radius,s=this.game.world.colliders.query(e-n,i-n,e+n,i+n),r=e,o=i;for(let c of s){if(c.tag==="floor"||c.tag==="stairs"||c.tag==="ramp"||this.pos.y+.4>=c.maxY||this.pos.y+this.height<=c.minY)continue;let h=Z(r,c.minX,c.maxX),d=Z(o,c.minZ,c.maxZ),u=r-h,f=o-d;if(u*u+f*f<n*n){let g=(n-Math.abs(u))*(u>=0?1:-1),y=(n-Math.abs(f))*(f>=0?1:-1);Math.abs(g)<Math.abs(y)?r+=g:o+=y,this.vel.x*=.6,this.vel.z*=.6}}this.pos.x=Z(r,-690,690),this.pos.z=Z(o,-490,490);let l=this.game.world.heightAt(this.pos.x,this.pos.z);this.pos.y=l,this.groundY=l}animate(t){let e=this.parts.bones;if(!e)return;let i=Math.hypot(this.vel.x,this.vel.z),n=i>.35,s=this.animT*(n?Z(i*2.1,3.4,13):1.6),r=Z(i/5,.08,1),o=this.def.build==="quadruped",l=Math.sin(this.animT*1.7)*.02;if(o)e.legs&&e.legs.forEach((c,h)=>{let d=s+h%2*Math.PI+(h>1?Math.PI*.5:0);c.rotation.x=Math.sin(d)*.75*r}),e.head&&(e.head.rotation.x=Math.sin(s*2)*.06*r-.05,e.head.position.y=.72+.08+Math.sin(this.animT*2.2)*.02),this.parts.root.position.y=this.pos.y+Math.abs(Math.sin(s))*.05*r;else{let c=.62*r,h=.5*r;e.legL&&(e.legL.rotation.x=Math.sin(s)*c),e.legR&&(e.legR.rotation.x=Math.sin(s+Math.PI)*c),e.armL&&(e.armL.rotation.x=Math.sin(s+Math.PI)*h-.12),e.armR&&(e.armR.rotation.x=Math.sin(s)*h-.12),e.armL&&(e.armL.rotation.z=-.12-Math.abs(Math.sin(s))*.06),e.armR&&(e.armR.rotation.z=.12+Math.abs(Math.sin(s))*.06),e.torso&&(e.torso.rotation.x=(n?.1:.02)+l,e.torso.rotation.z=Math.sin(s)*.045*r),e.head&&(e.head.rotation.x=-.08+Math.sin(this.animT*1.9)*.05+(this.state===$t.CHASE?-.1:0),e.head.rotation.y=Math.sin(this.animT*.7)*.16),this.parts.root.position.y=this.pos.y+Math.abs(Math.sin(s))*.035*r}if(this.state===$t.ATTACK){let c=Z(this.attackAnim/.42,0,1),h=this.attackKind==="ranged"?Math.sin(c*Math.PI)*.25:c<.55?-1.5*(c/.55):-1.5+2.4*((c-.55)/.45);e.armR&&(e.armR.rotation.x=h),e.armL&&(e.armL.rotation.x=h*.6),e.torso&&(e.torso.rotation.y=Math.sin(c*Math.PI)*.35),this.attackKind==="charge"&&e.torso&&(e.torso.rotation.x=.5),this.attackKind==="ranged"&&(e.armL&&(e.armL.rotation.x=-1.4),e.armR&&(e.armR.rotation.x=-1.4))}if(this.flinch>0){let c=this.flinch;e.torso&&(e.torso.rotation.x-=c*.35),e.head&&(e.head.rotation.x-=c*.5),e.armL&&(e.armL.rotation.z-=c*.4)}if(this.hitFlash>0){let c=this.hitFlash;this.parts.root.traverse(h=>{h.isMesh&&h.material&&h.material.emissive&&(h.userData._baseEmissive||(h.userData._baseEmissive=h.material.emissive.getHex()),h.material.emissive.setRGB(c*.9,c*.2,c*.15))})}else this._flashReset!==this.hitFlash&&this._wasFlashing&&this.parts.root.traverse(c=>{c.isMesh&&c.material&&c.material.emissive&&c.userData._baseEmissive!==void 0&&c.material.emissive.setHex(c.userData._baseEmissive)});this._wasFlashing=this.hitFlash>0}hurt(t,e={}){if(this.dead)return 0;let i=(this.def.armor||0)*(e.penetration?1-e.penetration:1),n=Math.max(1,t*(1-i));return this.hp-=n,this.hitFlash=1,this.flinch=1,this.aggro=1,this.lastKnown.copy(this.game.player.pos),(this.state===$t.IDLE||this.state===$t.PATROL)&&this.setState($t.CHASE),n>this.hpMax*.14&&!this.isBoss&&this.rng.chance(.35)&&this.setState($t.STAGGER),this.hp<=0&&this.die(e),n}die(t={}){this.dead||(this.dead=!0,this.deadTime=0,this.setState($t.DEAD),this.game.onEnemyKilled(this,t),this.game.audio.enemyDeath(this.type,this.pos),this.game.vfx.bloodBurst(this.center,this.vel.clone().normalize()),this.type==="screamer"&&(this.game.spawnGasCloud(this.pos,4.5,8,8978278),this.pos.distanceTo(this.game.player.pos)<5&&this.game.player.applyDamage(30,{radiation:15})))}updateDeath(t){this.deadTime+=t;let e=Z(this.deadTime/1.4,0,1),i=this.parts.root;this.def.build==="quadruped"?(i.rotation.z=Rt(0,Math.PI*.5,Ft(e)),i.position.y=this.pos.y+Rt(0,-.15,e)):(i.rotation.x=Rt(0,-Math.PI*.48,Ft(e*1.2)),i.position.y=this.pos.y+Rt(0,.22,e)),this.deadTime>22&&(this.parts.root.position.y-=t*.2,this.deadTime>26&&this.game.removeEnemy(this))}},Qs=class extends Js{constructor(t,e){let i=zn[e],n=t.world.arenas[i.arena];super(t,i.mutant,n.x,n.z,{hp:i.hp,eyeGlow:2.6,tint:i.mutant==="contaminated"?10551168:16777215}),this.bossId=e,this.bossDef=i,this.isBoss=!0,this.name=i.name,this.arena=n,this.phase=1,this.maxPhases=i.phases,this.parts.root.scale.setScalar(i.scale),this.radius=.6*i.scale,this.height=1.9*i.scale,this.attackTimer=2,this.specialCooldown=4,this.currentAttack=null,this.attackPhase="idle",this.introDone=!1,this.enraged=!1,this.home.set(n.x,n.y,n.z),this.arenaRadius=n.radius||16}update(t){if(this.dead){this.updateDeath(t);return}this.stateTime+=t,this.animT+=t,this.hitFlash=Math.max(0,this.hitFlash-t*4),this.flinch=Math.max(0,this.flinch-t*3);let e=this.game.player,i=Math.hypot(e.pos.x-this.pos.x,e.pos.z-this.pos.z);if(!this.introDone)if(this.stateTime>1.6)this.introDone=!0,this.setState($t.CHASE);else{this.faceTarget(e.pos,t),this.vel.multiplyScalar(.9),this.parts.root.position.copy(this.pos),this.parts.root.rotation.y=this.yaw,this.animate(t);return}let n=this.hp/this.hpMax,s=Math.min(this.maxPhases,1+Math.floor((1-n)*this.maxPhases+1e-4));s>this.phase&&(this.phase=s,this.specialCooldown=1.2,this.game.onBossPhase(this),this.game.audio.bossRoar(this.pos),this.game.spawnShockwave(this.pos,12+this.phase*3,16736304),this.game.vfx.dustBurst(this.pos,40),this.enraged=this.phase>=this.maxPhases,i<10+this.phase*2&&(e.applyDamage(8+this.phase*5,{body:"torso"}),e.addShake(.7))),this.attackTimer-=t,this.specialCooldown-=t,this.attackPhase==="idle"?this.specialCooldown<=0&&this.rng.chance(t*.9)?this.beginSpecial():i<(this.def.atkRange||3)+1.5&&this.attackTimer<=0?(this.attackKind="melee",this.attackAnim=0,this.attackHit=!1,this.attackTimer=1.1/(this.enraged?1.5:1),this.attackPhase="melee",this.game.audio.bossSwing(this.pos)):i>3?(this.moveToward(e.pos,(this.def.speed||3)*(this.enraged?1.35:1),t),this.game.keepInArena(this)):this.faceTarget(e.pos,t):this.runAttack(t,i),this.applyMovement(t),this.parts.root.position.copy(this.pos),this.parts.root.rotation.y=this.yaw,this.animate(t),this.game.keepInArena(this),this.def.radioactive&&(this.aura+=t,this.aura>.9&&(this.aura=0,i<8&&(e.stats.radiation=Z(e.stats.radiation+4,0,100))))}beginSpecial(){let t=this.bossDef.attacks;this.currentAttack=this.rng.pick(t),this.attackPhase="special",this.attackAnim=0,this.specialCooldown=this.enraged?5:8+this.rng.range(0,3),this.telegraph=.9,this.game.audio.bossRoar(this.pos),this.game.vfx.telegraphRing(this.pos,this.arenaRadius*.5,16732208)}runAttack(t,e){let i=this.game.player;this.attackAnim+=t,this.faceTarget(i.pos,t*.5);let n=this.currentAttack,s=this.attackAnim;if(this.attackPhase==="melee"){s>.35&&!this.attackHit&&(this.attackHit=!0,e<(this.def.atkRange||3)+1.8&&this.hitPlayer((this.def.dmg||20)*(this.enraged?1.4:1),{bleed:12,body:"torso"}),this.game.spawnShockwave(this.pos.clone().add(new P(Math.sin(this.yaw)*-2,0,Math.cos(this.yaw)*-2)),3.5,16752736)),s>.95&&(this.attackPhase="idle");return}if(!(s<this.telegraph)){if(!this.attackHit)switch(this.attackHit=!0,n){case"sweep":this.game.bossSweep(this,7);break;case"summon":this.game.bossSummon(this);break;case"scream_shock":this.game.spawnShockwave(this.pos,18,10551184),this.game.bossScreamShock(this);break;case"charge":this.chargeDir=i.pos.clone().sub(this.pos).setY(0).normalize();break;case"furnace_blast":this.game.bossProjectileFan(this,6,16736288);break;case"debris_throw":this.game.bossProjectileFan(this,3,10127984,{speed:18,damage:24});break;case"lunge":this.chargeDir=i.pos.clone().sub(this.pos).setY(0).normalize();break;case"spawn_brood":this.game.bossSummon(this,"crawler",3);break;case"web_bind":this.game.bossWebBind(this);break;case"rad_burst":this.game.spawnShockwave(this.pos,12,8978244),e<12&&i.applyDamage(18,{radiation:22});break;case"stomp":this.game.spawnShockwave(this.pos,9,16755268),e<9&&(i.applyDamage(22),i.addShake(.8));break;case"toxic_wave":this.game.bossProjectileFan(this,10,8978244,{speed:12,damage:16,spread:.5});break;case"slash_combo":this.game.bossSlashCombo(this);break;case"phase_shift":this.game.bossPhaseShift(this);break;case"order_assault":this.game.bossSummon(this,"hollow",4);break;case"resonance_wave":case"askarene":this.game.bossProjectileFan(this,12,10514687,{speed:14,damage:18});break;case"echo_swarm":this.game.bossSummon(this,"crawler",5);break;case"collapse":this.game.spawnShockwave(this.pos,30,16724e3),this.game.bossCollapse(this);break}this.chargeDir&&(this.vel.x=this.chargeDir.x*15,this.vel.z=this.chargeDir.z*15,e<4&&(i.applyDamage(28*(this.enraged?1.3:1),{fracture:this.rng.chance(.3)}),i.addShake(.9),this.chargeDir=null),s>1.6&&(this.chargeDir=null)),s>this.telegraph+1.2&&(this.attackPhase="idle")}}hurt(t,e){return super.hurt(t*(this.isBoss,1),e)}};var Ra=class{constructor(t){this.scene=t,this.rng=new Pt(4242),this.pools={},this.particles=[],this.decals=[],this.rings=[],this.tracers=[],this.lights=[],this.maxParticles=900,this.spriteGeo=new ze(1,1),this.boxGeo=new Qi(1,1,1),this.sphereGeo=new Ei(1,8,6),this.mats={blood:new Ce({color:9048080,transparent:!0,opacity:.95,depthWrite:!1}),bloodDark:new Ce({color:4851720,transparent:!0,opacity:.9,depthWrite:!1}),spark:new Ce({color:16766090,transparent:!0,opacity:1,depthWrite:!1,blending:Oi}),smoke:new Ce({color:6974054,transparent:!0,opacity:.4,depthWrite:!1}),dust:new Ce({color:10129276,transparent:!0,opacity:.5,depthWrite:!1}),flash:new Ce({color:16770736,transparent:!0,opacity:1,depthWrite:!1,blending:Oi}),glow:new Ce({color:8978346,transparent:!0,opacity:.8,depthWrite:!1,blending:Oi}),tracers:new Ce({color:16769184,transparent:!0,opacity:.85,depthWrite:!1,blending:Oi}),ring:new Ce({color:16777215,transparent:!0,opacity:.7,depthWrite:!1,side:_e,blending:Oi})},this.decalMats={blood:vt("blood",{transparent:!0,depthWrite:!1,polygonOffset:!0,alphaTest:.1}),bullet:vt("bullet",{transparent:!0,depthWrite:!1,polygonOffset:!0,alphaTest:.1})},this.decalQueue=[]}spawn(t,e){if(this.particles.length>this.maxParticles){let s=this.particles.shift();this.scene.remove(s.mesh)}let i=new At(e.geo||this.boxGeo,e.mat||this.mats.dust);i.position.copy(t),i.scale.setScalar(e.size||.1),e.geo===this.spriteGeo&&i.lookAt(t.clone().add(new P(0,1,1))),this.scene.add(i);let n={mesh:i,vel:e.vel?e.vel.clone():new P,life:e.life||.6,maxLife:e.life||.6,gravity:e.gravity??-9.8,drag:e.drag??1.5,grow:e.grow??0,fade:e.fade!==!1,spin:e.spin||0,baseOpacity:e.mat?e.mat.opacity:1,additive:!!e.additive};return n.mesh.material=n.mesh.material.clone(),n.mesh.material.transparent=!0,this.particles.push(n),n}bloodBurst(t,e,i=14,n=1){let s=e?e.clone().normalize():new P(0,1,0);for(let r=0;r<i;r++){let o=s.clone().multiplyScalar(this.rng.range(1.2,4.5)*n).add(new P(this.rng.range(-1,1),this.rng.range(-.3,1.4),this.rng.range(-1,1)).multiplyScalar(2.2*n));this.spawn(t.clone().add(new P(this.rng.range(-.1,.1),this.rng.range(-.1,.1),this.rng.range(-.1,.1))),{mat:this.rng.chance(.5)?this.mats.blood:this.mats.bloodDark,vel:o,life:this.rng.range(.35,.9),size:this.rng.range(.035,.11)*n,gravity:-11,drag:1.2})}for(let r=0;r<4;r++)this.spawn(t.clone(),{mat:this.mats.bloodDark,geo:this.spriteGeo,vel:s.clone().multiplyScalar(this.rng.range(.4,1.6)).add(new P(this.rng.range(-.4,.4),this.rng.range(-.2,.4),this.rng.range(-.4,.4))),life:.5,size:this.rng.range(.25,.5)*n,gravity:-1.5,grow:1.4})}dustBurst(t,e=16,i=1){for(let n=0;n<e;n++){let s=this.rng.range(0,6.28),r=this.rng.range(.5,3);this.spawn(t.clone().add(new P(Math.cos(s)*.3,.1,Math.sin(s)*.3)),{mat:this.mats.dust,geo:this.spriteGeo,vel:new P(Math.cos(s)*r,this.rng.range(.4,2.2),Math.sin(s)*r),life:this.rng.range(.7,1.6),size:this.rng.range(.3,.9)*i,gravity:-.6,drag:2.2,grow:1.8})}}impact(t,e,i="concrete"){let n=e||new P(0,1,0),s={concrete:11577498,metal:16766090,wood:10123856,dirt:9075296,flesh:9048080};for(let r=0;r<7;r++){let o=n.clone().multiplyScalar(this.rng.range(1,4)).add(new P(this.rng.range(-1,1),this.rng.range(-1,1),this.rng.range(-1,1)));this.spawn(t.clone(),{mat:i==="metal"?this.mats.spark:this.mats.dust,geo:i==="metal"?this.boxGeo:this.spriteGeo,vel:o,life:this.rng.range(.2,.6),size:this.rng.range(.03,.09),gravity:-8,drag:1})}for(let r=0;r<3;r++)this.spawn(t.clone().addScaledVector(n,.05),{mat:this.mats.dust,geo:this.spriteGeo,vel:n.clone().multiplyScalar(this.rng.range(.3,1)).add(new P(this.rng.range(-.4,.4),.2,this.rng.range(-.4,.4))),life:.7,size:this.rng.range(.15,.4),gravity:.2,drag:2.4,grow:1.5});i!=="flesh"&&this.rng.chance(.6)&&this.addDecal("bullet",t,n)}muzzleFlash(t,e){let i=new Ke(16760944,5,9,2);i.position.copy(t),this.scene.add(i),this.lights.push({light:i,life:.06,maxLife:.06});for(let n=0;n<5;n++)this.spawn(t.clone(),{mat:this.mats.flash,geo:this.spriteGeo,vel:e.clone().multiplyScalar(this.rng.range(4,12)).add(new P(this.rng.range(-.6,.6),this.rng.range(-.6,.6),this.rng.range(-.6,.6))),life:.07,size:this.rng.range(.1,.3),gravity:0,drag:6});for(let n=0;n<2;n++)this.spawn(t.clone(),{mat:this.mats.smoke,geo:this.spriteGeo,vel:e.clone().multiplyScalar(this.rng.range(.6,1.6)),life:.6,size:.12,gravity:.4,drag:2.5,grow:1.6})}tracer(t,e,i=16769184){let n=new ii(.012,.012,1,3,1,!0),s=new At(n,this.mats.tracers.clone());s.material.color.setHex(i);let r=e.clone().sub(t),o=r.length();o<.01||(s.position.copy(t.clone().addScaledVector(r,.5)),s.scale.set(1,o,1),s.quaternion.setFromUnitVectors(new P(0,1,0),r.normalize()),s.material.opacity=.8,this.scene.add(s),this.tracers.push({mesh:s,life:.055,maxLife:.055}))}meleeArc(t,e,i,n=16744544){let s=new fs(i*.35,i,12,1,-.6,1.2),r=new At(s,this.mats.ring.clone());r.material.color.setHex(n),r.material.opacity=.5,r.rotation.x=-Math.PI/2,r.rotation.z=e,r.position.set(t.x,t.y+1,t.z),this.scene.add(r),this.rings.push({mesh:r,life:.18,maxLife:.18,grow:2})}spawnShockwave(t,e,i=16777215){let n=new fs(e*.15,e*.22,32),s=new At(n,this.mats.ring.clone());s.material.color.setHex(i),s.rotation.x=-Math.PI/2,s.position.set(t.x,t.y+.12,t.z),this.scene.add(s),this.rings.push({mesh:s,life:.55,maxLife:.55,grow:5}),this.dustBurst(t,10,1.4)}telegraphRing(t,e,i=16732208){let n=new fs(e*.92,e,40),s=new At(n,this.mats.ring.clone());s.material.color.setHex(i),s.material.opacity=.45,s.rotation.x=-Math.PI/2,s.position.set(t.x,t.y+.08,t.z),this.scene.add(s),this.rings.push({mesh:s,life:.9,maxLife:.9,grow:.4,pulse:!0})}gasCloud(t,e,i=6,n=8978278){for(let s=0;s<22;s++){let r=this.rng.range(0,6.28),o=this.rng.range(0,e);this.spawn(t.clone().add(new P(Math.cos(r)*o,this.rng.range(0,1.2),Math.sin(r)*o)),{mat:new Ce({color:n,transparent:!0,opacity:.3,depthWrite:!1}),geo:this.spriteGeo,vel:new P(this.rng.range(-.2,.2),this.rng.range(.05,.3),this.rng.range(-.2,.2)),life:i*this.rng.range(.6,1.1),size:this.rng.range(.6,1.6),gravity:.02,drag:.4,grow:1.1})}}addDecal(t,e,i){if(this.decals.length>160){let o=this.decals.shift();this.scene.remove(o.mesh),o.mesh.geometry.dispose()}let n=new ze(.16,.16),s=new At(n,this.decalMats[t]),r=i.clone().normalize();s.position.copy(e).addScaledVector(r,.012),s.lookAt(e.clone().add(r)),s.rotateZ(this.rng.range(0,6.28)),t==="blood"&&s.scale.setScalar(this.rng.range(.8,2.2)),s.renderOrder=1,this.scene.add(s),this.decals.push({mesh:s,life:60})}update(t){for(let e=this.particles.length-1;e>=0;e--){let i=this.particles[e];if(i.life-=t,i.life<=0){this.scene.remove(i.mesh),i.mesh.material.dispose(),this.particles.splice(e,1);continue}i.vel.y+=i.gravity*t;let n=Math.max(0,1-i.drag*t);i.vel.multiplyScalar(n),i.mesh.position.addScaledVector(i.vel,t),i.spin&&(i.mesh.rotation.z+=i.spin*t);let s=i.life/i.maxLife;i.grow&&i.mesh.scale.multiplyScalar(1+i.grow*t),i.fade&&(i.mesh.material.opacity=s*i.baseOpacity)}for(let e=this.tracers.length-1;e>=0;e--){let i=this.tracers[e];i.life-=t,i.mesh.material.opacity=Math.max(0,i.life/i.maxLife)*.85,i.life<=0&&(this.scene.remove(i.mesh),i.mesh.geometry.dispose(),this.tracers.splice(e,1))}for(let e=this.rings.length-1;e>=0;e--){let i=this.rings[e];i.life-=t;let n=1-i.life/i.maxLife;i.mesh.scale.setScalar(1+n*i.grow),i.mesh.material.opacity=(1-n)*(i.pulse?.6+Math.sin(n*30)*.3:.7),i.life<=0&&(this.scene.remove(i.mesh),i.mesh.geometry.dispose(),i.mesh.material.dispose(),this.rings.splice(e,1))}for(let e=this.lights.length-1;e>=0;e--){let i=this.lights[e];i.life-=t,i.light.intensity=Math.max(0,i.life/i.maxLife)*5,i.life<=0&&(this.scene.remove(i.light),this.lights.splice(e,1))}for(let e=this.decals.length-1;e>=0;e--){let i=this.decals[e];i.life-=t,i.life<4&&(i.mesh.material.opacity=.7),i.life<=0&&(this.scene.remove(i.mesh),i.mesh.geometry.dispose(),this.decals.splice(e,1))}}};var Ca=class{constructor(t){this.camera=t,this.ctx=null,this.master=null,this.ready=!1,this.volume=.75,this.musicVolume=.4,this.rng=new Pt(9371),this.buffers={},this.listener=null,this.activeMusic=null,this.musicTimer=0,this.mood="explore",this.combatIntensity=0}init(){if(this.ctx)return;let t=window.AudioContext||window.webkitAudioContext;t&&(this.ctx=new t,this.master=this.ctx.createGain(),this.master.gain.value=this.volume,this.master.connect(this.ctx.destination),this.reverb=this.ctx.createConvolver(),this.reverb.buffer=this.makeImpulse(2.4,2.2),this.reverbGain=this.ctx.createGain(),this.reverbGain.gain.value=.22,this.reverb.connect(this.reverbGain),this.reverbGain.connect(this.master),this.musicBus=this.ctx.createGain(),this.musicBus.gain.value=0,this.musicBus.connect(this.master),this.musicFilter=this.ctx.createBiquadFilter(),this.musicFilter.type="lowpass",this.musicFilter.frequency.value=2400,this.musicFilter.connect(this.musicBus),this.ambience=this.ctx.createGain(),this.ambience.gain.value=0,this.ambience.connect(this.master),this.buildBuffers(),this.startAmbience(),this.ready=!0)}makeImpulse(t,e){let i=this.ctx.sampleRate,n=Math.floor(i*t),s=this.ctx.createBuffer(2,n,i);for(let r=0;r<2;r++){let o=s.getChannelData(r);for(let l=0;l<n;l++)o[l]=(Math.random()*2-1)*Math.pow(1-l/n,e)}return s}noiseBuffer(t=1,e="white"){let i=this.ctx.sampleRate,n=Math.floor(i*t),s=this.ctx.createBuffer(1,n,i),r=s.getChannelData(0),o=0;for(let l=0;l<n;l++){let c=Math.random()*2-1;e==="brown"?(o=(o+.02*c)/1.02,r[l]=o*3.5):e==="pink"?(o=o*.94+c*.06,r[l]=o*2.2):r[l]=c}return s}buildBuffers(){this.buffers.white=this.noiseBuffer(1,"white"),this.buffers.brown=this.noiseBuffer(2,"brown"),this.buffers.pink=this.noiseBuffer(2,"pink");let t=this.noiseBuffer(6,"brown");this.buffers.wind=t;let e=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate),i=e.getChannelData(0);for(let n=0;n<i.length;n++)i[n]=(Math.random()<.5?-1:1)*(Math.random()*.7)*(Math.random()<.02?1:.25);this.buffers.static=e}now(){return this.ctx?this.ctx.currentTime:0}gainNode(t=1){let e=this.ctx.createGain();return e.gain.value=t,e}spatial(t,e=40){if(!this.ctx||!this.camera)return{node:this.master,dist:0,gain:1,pan:0};let i=this.camera.position,n=t.x-i.x,s=t.y-i.y,r=t.z-i.z,o=Math.hypot(n,s,r),l=Z(1-o/e,0,1)**2,c=this.ctx.createPanner();return c.panningModel="HRTF",c.distanceModel="inverse",c.refDistance=4,c.maxDistance=e,c.rolloffFactor=1.2,c.positionX.value=n,c.positionY.value=s,c.positionZ.value=r,c.connect(this.master),{node:c,dist:o,gain:l,pan:0}}playNoise(t={}){if(!this.ctx)return;let e=this.ctx.createBufferSource();e.buffer=this.buffers[t.color||"white"],e.loop=!0,e.playbackRate.value=t.rate||1;let i=this.ctx.createBiquadFilter();i.type=t.filterType||"bandpass",i.frequency.value=t.freq||1200,i.Q.value=t.q||1.2;let n=this.ctx.createGain(),s=this.now(),r=t.dur||.2,o=t.volume??.4;n.gain.setValueAtTime(1e-4,s),n.gain.exponentialRampToValueAtTime(Math.max(2e-4,o),s+(t.attack||.004)),n.gain.exponentialRampToValueAtTime(1e-4,s+r),i.frequency.exponentialRampToValueAtTime(Math.max(80,t.freqEnd||t.freq||1200),s+r),e.connect(i),i.connect(n);let l=n;if(t.pos?l.connect(this.spatial(t.pos,t.maxDist||50).node):l.connect(this.master),t.reverb){let c=this.ctx.createGain();c.gain.value=.4,n.connect(c),c.connect(this.reverb)}e.start(s),e.stop(s+r+.02)}playTone(t={}){if(!this.ctx)return;let e=this.ctx.createOscillator();e.type=t.type||"sine";let i=this.now(),n=t.dur||.3;e.frequency.setValueAtTime(t.freq||220,i),t.freqEnd&&e.frequency.exponentialRampToValueAtTime(Math.max(20,t.freqEnd),i+n);let s=this.ctx.createGain(),r=t.volume??.3;s.gain.setValueAtTime(1e-4,i),s.gain.exponentialRampToValueAtTime(Math.max(2e-4,r),i+(t.attack||.008)),s.gain.exponentialRampToValueAtTime(1e-4,i+n);let o=s;if(t.filter){let l=this.ctx.createBiquadFilter();l.type="lowpass",l.frequency.value=t.filter,s.connect(l),o=l}e.connect(s),o.connect(this.master),e.start(i),e.stop(i+n+.02)}gunshot(t="pistol",e=null,i=!1){if(!this.ctx)return;let n={pistol:{vol:.5,freq:1800,dur:.16,tone:120,tail:.28},rifle:{vol:.68,freq:1300,dur:.22,tone:90,tail:.5},shotgun:{vol:.85,freq:900,dur:.28,tone:70,tail:.6},smg:{vol:.4,freq:2e3,dur:.12,tone:150,tail:.2},bow:{vol:.25,freq:3200,dur:.1,tone:220,tail:.12}}[t]||{vol:.5,freq:1500,dur:.15,tone:120,tail:.3},s=i?.28:1;this.playNoise({color:"white",freq:n.freq*(i?.5:1),q:.8,dur:n.dur,volume:n.vol*s,pos:e,maxDist:120,attack:.001,freqEnd:400}),this.playTone({type:"square",freq:n.tone,freqEnd:n.tone*.35,dur:n.dur*.8,volume:n.vol*.5*s,filter:800}),i||this.playNoise({color:"brown",freq:600,q:.6,dur:n.tail,volume:n.vol*.22,pos:e,maxDist:200,attack:.05,freqEnd:150})}dryFire(){this.playNoise({freq:3200,q:4,dur:.05,volume:.18})}reload(t=0){this.playNoise({freq:2200+t*600,q:6,dur:.07,volume:.25}),this.playTone({type:"square",freq:420,freqEnd:300,dur:.05,volume:.12})}shellDrop(){this.playTone({type:"triangle",freq:1800,freqEnd:900,dur:.08,volume:.09})}meleeHit(t,e=!1){this.playNoise({freq:e?500:900,q:1.4,dur:e?.16:.1,volume:.35,pos:t}),this.playTone({type:"sine",freq:e?90:160,freqEnd:40,dur:.2,volume:.3})}swing(){this.playNoise({color:"pink",freq:1400,q:1.8,dur:.16,volume:.16,attack:.03,freqEnd:400})}hitBody(t){this.playNoise({freq:260,q:1,dur:.12,volume:.4,pos:t}),this.playTone({type:"sine",freq:120,freqEnd:50,dur:.16,volume:.25})}impactHard(t){this.playNoise({freq:700,q:.8,dur:.26,volume:.45,pos:t,freqEnd:120}),this.playTone({type:"sine",freq:70,freqEnd:35,dur:.4,volume:.3})}footstep(t="grass",e=.5){if(!this.ctx)return;let i={grass:{freq:900,q:.7,dur:.09,color:"pink"},dirt:{freq:600,q:.9,dur:.1,color:"pink"},gravel:{freq:2400,q:1.1,dur:.11,color:"white"},concrete:{freq:1600,q:1.4,dur:.07,color:"white"},sand:{freq:1100,q:.6,dur:.12,color:"pink"},metal:{freq:2800,q:3,dur:.14,color:"white"},water:{freq:800,q:.5,dur:.18,color:"white"}}[t]||{freq:900,q:.8,dur:.09,color:"pink"};this.playNoise({color:i.color,freq:i.freq*(.9+Math.random()*.2),q:i.q,dur:i.dur,volume:.1*e,attack:.002})}breathHard(){this.playNoise({color:"pink",freq:700,q:.8,dur:.5,volume:.08,attack:.1,freqEnd:400})}enemyAlert(t,e){let i={hollow:{freq:320,end:180,dur:.7,type:"sawtooth"},crawler:{freq:900,end:400,dur:.35,type:"square"},watcher:{freq:140,end:90,dur:1.2,type:"sine"},screamer:{freq:1100,end:700,dur:1.4,type:"sawtooth"},brute:{freq:90,end:55,dur:1,type:"sawtooth"},mimic:{freq:600,end:500,dur:.6,type:"triangle"},burrower:{freq:220,end:140,dur:.5,type:"square"},stalker:{freq:260,end:120,dur:.9,type:"sawtooth"},contaminated:{freq:160,end:80,dur:1.1,type:"sawtooth"},pale:{freq:1200,end:300,dur:1,type:"sine"}}[t]||{freq:300,end:160,dur:.6,type:"sawtooth"};this.playTone({type:i.type,freq:i.freq,freqEnd:i.end,dur:i.dur,volume:.16,filter:1800}),this.playNoise({color:"pink",freq:i.freq*2,q:3,dur:i.dur*.8,volume:.1,pos:e,maxDist:60,attack:.05,freqEnd:i.end})}enemyGrowl(t,e){this.playNoise({color:"brown",freq:320,q:1.6,dur:.5,volume:.18,pos:e,maxDist:40,attack:.06,freqEnd:180})}enemyDeath(t,e){this.playNoise({color:"brown",freq:420,q:.8,dur:.9,volume:.28,pos:e,freqEnd:120}),this.playTone({type:"sawtooth",freq:180,freqEnd:60,dur:.8,volume:.14,filter:700})}scream(t){this.playTone({type:"sawtooth",freq:1400,freqEnd:600,dur:1.1,volume:.3,filter:3200}),this.playNoise({color:"pink",freq:2200,q:2,dur:1.2,volume:.18,pos:t,maxDist:80})}bossRoar(t){this.playTone({type:"sawtooth",freq:70,freqEnd:40,dur:2,volume:.4,filter:500}),this.playNoise({color:"brown",freq:260,q:.8,dur:2.2,volume:.3,pos:t,maxDist:160,attack:.2,freqEnd:90})}bossSwing(t){this.playNoise({color:"brown",freq:500,q:1.1,dur:.5,volume:.3,pos:t,maxDist:90,attack:.1,freqEnd:130})}pickup(){this.playTone({type:"sine",freq:880,dur:.09,volume:.1}),this.playTone({type:"sine",freq:1320,dur:.12,volume:.07})}uiClick(){this.playTone({type:"square",freq:1400,dur:.03,volume:.06})}uiHover(){this.playTone({type:"sine",freq:1800,dur:.02,volume:.03})}uiOpen(){this.playTone({type:"triangle",freq:400,freqEnd:700,dur:.14,volume:.08})}uiClose(){this.playTone({type:"triangle",freq:700,freqEnd:380,dur:.12,volume:.07})}questUpdate(){this.playTone({type:"sine",freq:620,dur:.18,volume:.12}),setTimeout(()=>this.playTone({type:"sine",freq:930,dur:.3,volume:.1}),120)}levelUp(){[523,659,784,1046].forEach((t,e)=>setTimeout(()=>this.playTone({type:"triangle",freq:t,dur:.5,volume:.14}),e*110))}craft(){this.playNoise({freq:700,q:2,dur:.3,volume:.2})}doorOpen(t){this.playNoise({color:"brown",freq:380,q:2.4,dur:.7,volume:.2,pos:t,maxDist:30,attack:.1,freqEnd:260})}hurt(){this.playNoise({color:"pink",freq:420,q:1.2,dur:.22,volume:.28})}startAmbience(){if(!this.ctx)return;let t=this.ctx.createBufferSource();t.buffer=this.buffers.wind,t.loop=!0;let e=this.ctx.createBiquadFilter();e.type="lowpass",e.frequency.value=420;let i=this.ctx.createGain();i.gain.value=.14,t.connect(e),e.connect(i),i.connect(this.ambience),t.start(),this.windGain=i,this.windFilter=e;let n=this.ctx.createOscillator();n.type="sine",n.frequency.value=46;let s=this.ctx.createGain();s.gain.value=.035,n.connect(s),s.connect(this.ambience),n.start(),this.drone=s,this.ambience.gain.value=.9}startMusic(){if(!this.ctx||this.musicStarted)return;this.musicStarted=!0,this.musicBus.gain.cancelScheduledValues(this.now()),this.musicBus.gain.setValueAtTime(1e-4,this.now()),this.musicBus.gain.linearRampToValueAtTime(this.musicVolume*.6,this.now()+4),this.pad=[],[55,82.4,110,164.8].forEach((e,i)=>{let n=this.ctx.createOscillator();n.type=i%2?"triangle":"sine",n.frequency.value=e;let s=this.ctx.createGain();s.gain.value=.02/(i+1),n.connect(s),s.connect(this.musicFilter),n.start(),this.pad.push({o:n,g:s,base:e})}),this.pulseTimer=0}setMood(t,e=0){if(this.mood=t,this.combatIntensity=e,!this.musicFilter)return;let i=t==="combat"?3800:t==="horror"?900:2200;this.musicFilter.frequency.setTargetAtTime(i,this.now(),1.2),this.musicBus&&this.musicBus.gain.setTargetAtTime(this.musicVolume*(t==="combat"?.9:.5),this.now(),1)}update(t,e={}){if(this.ctx){if(this.windGain){let i=e.wind??.3;this.windGain.gain.setTargetAtTime(.05+i*.22,this.now(),.6),this.windFilter.frequency.setTargetAtTime(260+i*700,this.now(),.8)}if(this.pad){this.pulseTimer+=t;let i=e.time??0;this.pad.forEach((n,s)=>{let r=Math.sin(i*.07+s*1.7)*2.2;n.o.frequency.setTargetAtTime(n.base+r,this.now(),1.4)}),this.mood==="combat"&&this.pulseTimer>Math.max(.34,.9-this.combatIntensity*.5)&&(this.pulseTimer=0,this.playTone({type:"sine",freq:62,freqEnd:40,dur:.28,volume:.09}),this.combatIntensity>.6&&setTimeout(()=>this.playNoise({freq:180,q:1.2,dur:.12,volume:.05}),160))}if(this.ambTimer=(this.ambTimer||0)-t,this.ambTimer<=0){this.ambTimer=6+Math.random()*16;let i=e.ambience||[];if(i.length){let n=i[Math.floor(Math.random()*i.length)];this.playAmbientOneShot(n)}}}}playAmbientOneShot(t){switch(t){case"creaking":this.playNoise({color:"brown",freq:300+Math.random()*200,q:5,dur:1.2,volume:.06,attack:.2,freqEnd:200});break;case"metal":this.playTone({type:"triangle",freq:220+Math.random()*300,freqEnd:180,dur:1.4,volume:.04});break;case"drips":this.playTone({type:"sine",freq:1200+Math.random()*600,freqEnd:700,dur:.12,volume:.05});break;case"crows":for(let e=0;e<3;e++)setTimeout(()=>this.playNoise({freq:1600,q:6,dur:.09,volume:.05}),e*130);break;case"hum":this.playTone({type:"sine",freq:60,dur:2.4,volume:.05,attack:.5});break;case"radio_static":this.playNoise({color:"white",freq:2400,q:.7,dur:1.6,volume:.05,attack:.2});break;case"geiger":for(let e=0;e<9;e++)setTimeout(()=>this.playNoise({freq:4200,q:8,dur:.012,volume:.06}),e*(90+Math.random()*120));break;case"steam":this.playNoise({color:"white",freq:3e3,q:.9,dur:1.8,volume:.07,attack:.15,freqEnd:1200});break;case"wind_gap":this.playNoise({color:"brown",freq:700,q:2,dur:2.6,volume:.08,attack:.6,freqEnd:300});break;case"distant_siren":this.playTone({type:"sine",freq:420,freqEnd:380,dur:3.2,volume:.035,attack:.8});break;case"branches":this.playNoise({color:"pink",freq:1100,q:3,dur:.5,volume:.05});break;case"machinery":this.playNoise({color:"brown",freq:220,q:3,dur:2,volume:.06,attack:.3});break;case"radiation_storm":this.playNoise({color:"brown",freq:380,q:.8,dur:4,volume:.1,attack:1,freqEnd:160});break;case"birds_far":this.playNoise({freq:2600,q:9,dur:.14,volume:.03});break;case"wind":default:break}}trade(){this.playTone({type:"triangle",freq:880,dur:.08,volume:.12}),setTimeout(()=>this.playTone({type:"triangle",freq:1320,dur:.1,volume:.1}),60)}equip(){this.playNoise({freq:1800,q:3,dur:.09,volume:.16,freqEnd:900})}heal(){this.playTone({type:"sine",freq:420,freqEnd:620,dur:.4,volume:.1})}door(t=!0){this.playNoise({color:"brown",freq:t?420:320,q:.9,dur:.5,volume:.13,attack:.03,freqEnd:t?180:520}),t||this.playTone({type:"square",freq:90,dur:.12,volume:.12,filter:300})}discovery(){this.playTone({type:"sine",freq:220,freqEnd:330,dur:.9,volume:.12}),this.playNoise({color:"pink",freq:900,q:.7,dur:1.2,volume:.05,attack:.3,reverb:!0})}eventSting(){this.playTone({type:"sawtooth",freq:70,freqEnd:48,dur:1.6,volume:.16,filter:380}),this.playNoise({color:"brown",freq:240,q:.6,dur:2,volume:.09,attack:.4})}radioStatic(){this.playNoise({color:"white",freq:2400,q:1.4,dur:1.8,volume:.06,attack:.2})}paleHowl(){this.playTone({type:"sine",freq:300,freqEnd:180,dur:2.2,volume:.09,attack:.5}),this.playNoise({color:"pink",freq:800,q:.8,dur:2.4,volume:.05,attack:.6,reverb:!0})}bossDeath(){this.playNoise({color:"brown",freq:400,q:.5,dur:3,volume:.22,attack:.2,freqEnd:80}),this.playTone({type:"sawtooth",freq:110,freqEnd:32,dur:2.6,volume:.16,filter:420})}stopMusic(){this.musicActive=!1,this.musicBus&&(this.musicBus.gain.value=0)}setListener(t){this.camera=t}setVolume(t){this.volume=t,this.master&&(this.master.gain.value=t)}setMusicVolume(t){this.musicVolume=t,this.musicBus&&(this.musicBus.gain.value=t*.6)}};var Gg=()=>vt("metal_paint",{color:5264986}),Wg=()=>vt("steel",{color:10133668}),tr=()=>vt("wood",{color:11571312}),qg=()=>ye(2237994,{roughness:.7,metalness:.4}),Xg=()=>ye(3817282,{roughness:.9});function Mt(a,t,e,i,n,s,r){let o=new At(t,e);return o.position.set(i,n,s),r&&o.rotation.set(r[0]||0,r[1]||0,r[2]||0),o.castShadow=!0,a.add(o),o}function $g(a){let t=new Kt,e=Me[a];if(!e)return t;let i=Gg(),n=Wg(),s=tr(),r=qg(),o=Xg();switch(a){case"pistol":Mt(t,C(.045,.05,.2),n,0,.06,-.06),Mt(t,C(.04,.11,.055),r,0,0,.01,[.18,0,0]),Mt(t,rt(.012,.012,.07,6),r,0,.062,-.14),Mt(t,C(.03,.022,.06),i,0,.088,-.1),Mt(t,C(.008,.012,.012),n,0,.078,-.155);break;case"revolver":Mt(t,C(.042,.055,.15),n,0,.065,-.05),Mt(t,rt(.032,.032,.055,8),i,0,.062,-.02,[0,0,Math.PI/2]),Mt(t,C(.036,.12,.05),s,0,-.005,.02,[.22,0,0]),Mt(t,rt(.009,.009,.14,6),r,0,.065,-.16),Mt(t,C(.01,.02,.02),i,0,.098,-.09);break;case"shotgun":Mt(t,C(.05,.06,.5),n,0,.06,-.2),Mt(t,rt(.022,.022,.46,8),r,0,.062,-.42),Mt(t,rt(.022,.022,.46,8),r,0,.035,-.42),Mt(t,C(.05,.05,.16),s,0,.035,-.2),Mt(t,C(.045,.1,.06),s,0,.02,.06,[.3,0,0]),Mt(t,C(.05,.09,.2),s,0,.03,.16);break;case"pump_shotgun":Mt(t,C(.05,.07,.44),i,0,.06,-.18),Mt(t,rt(.021,.021,.5,8),r,0,.068,-.44),Mt(t,rt(.025,.025,.16,8),s,0,.04,-.3),Mt(t,C(.045,.1,.055),r,0,0,.03,[.22,0,0]),Mt(t,C(.05,.085,.22),r,0,.045,.16),Mt(t,C(.02,.03,.05),n,0,.1,-.05);break;case"assault_rifle":Mt(t,C(.05,.07,.36),i,0,.06,-.1),Mt(t,C(.055,.06,.22),tr(),0,.05,-.32),Mt(t,rt(.014,.014,.24,8),r,0,.065,-.5),Mt(t,C(.035,.16,.06),r,0,-.04,-.05,[.35,0,0]),Mt(t,C(.04,.1,.05),r,0,.005,.06,[.25,0,0]),Mt(t,C(.05,.08,.24),tr(),0,.045,.2),Mt(t,C(.016,.03,.06),n,0,.1,-.16),Mt(t,C(.01,.05,.01),n,0,.11,-.02);break;case"hunting_rifle":Mt(t,C(.04,.05,.34),i,0,.06,-.1),Mt(t,rt(.011,.011,.6,8),r,0,.062,-.5),Mt(t,C(.045,.09,.28),s,0,.03,.2),Mt(t,C(.04,.1,.05),r,0,-.005,.03,[.24,0,0]),Mt(t,C(.035,.09,.16),s,0,.03,-.27),Mt(t,rt(.022,.022,.18,10),r,0,.105,-.1,[Math.PI/2,0,0]),Mt(t,C(.016,.05,.02),n,0,.08,-.06);break;case"smg":Mt(t,C(.045,.06,.26),i,0,.06,-.06),Mt(t,rt(.013,.013,.16,8),r,0,.062,-.25),Mt(t,C(.03,.13,.045),r,0,-.03,-.04,[.2,0,0]),Mt(t,C(.035,.07,.04),r,0,0,.05,[.3,0,0]),Mt(t,C(.012,.02,.09),n,0,.04,.14),Mt(t,C(.01,.06,.01),n,0,.035,.05);break;case"crossbow":Mt(t,C(.045,.05,.34),o,0,.06,-.06),Mt(t,C(.5,.02,.03),r,0,.075,-.2,[0,0,0]),Mt(t,C(.03,.06,.2),o,0,0,.06,[.2,0,0]),Mt(t,rt(.006,.006,.4,5),n,0,.09,-.22,[Math.PI/2,0,0]),Mt(t,C(.05,.03,.06),n,0,.1,-.05);break;case"improvised_shotgun":Mt(t,rt(.026,.026,.42,8),E.rust,0,.06,-.16),Mt(t,C(.04,.1,.05),tr(),0,0,.02,[.25,0,0]),Mt(t,C(.05,.05,.1),E.rust,0,.03,.08),Mt(t,C(.06,.012,.06),E.steel,0,.09,-.06);break;case"knife":Mt(t,C(.012,.03,.18),n,0,.02,-.1),Mt(t,C(.016,.04,.09),r,0,.015,.03),Mt(t,C(.03,.012,.012),i,0,.015,-.02);break;case"fireaxe":Mt(t,rt(.016,.018,.6,6),tr(),0,.06,-.1,[Math.PI/2,0,0]),Mt(t,C(.02,.12,.1),ye(9124399,{roughness:.7,metalness:.5}),0,.06,-.34),Mt(t,C(.008,.09,.03),n,.045,.06,-.34);break;case"machete":Mt(t,C(.014,.075,.34),E.steel,0,.04,-.17,[0,0,0]),Mt(t,C(.02,.045,.1),r,0,.02,.03);break;case"pipe":Mt(t,rt(.018,.018,.65,6),E.rust,0,.05,-.12,[Math.PI/2,0,0]),Mt(t,C(.03,.032,.09),r,0,.04,.16),Mt(t,rt(.026,.026,.03,6),E.rust,0,.05,-.42,[Math.PI/2,0,0]);break;default:Mt(t,C(.05,.06,.3),i,0,.06,-.15)}return e.attachments&&e.attachments.includes("scope_small")&&Mt(t,rt(.014,.014,.09,8),r,0,.105,-.12,[Math.PI/2,0,0]),t.userData.weaponId=a,t}var er=class{constructor(t){this.game=t,this.current=null,this.viewModel=new Kt,this.viewModel.name="viewmodel",t.camera.add(this.viewModel),this.rig=new Kt,this.viewModel.add(this.rig),this.state={mag:0,reserve:0,durability:1,reloading:!1,reloadT:0,fireT:0,spread:0,recoil:0,aimBlend:0,swayX:0,swayY:0,bobT:0,meleeT:0,switching:0,lastShot:-10,burst:0,jammed:!1},this.muzzle=new Ne,this.muzzle.position.set(0,.06,-.45),this.rig.add(this.muzzle),this.flashLight=new Ke(16760944,0,12,2),this.flashLight.position.copy(this.muzzle.position),this.rig.add(this.flashLight),this.flashTimer=0,this.attachmentMap={},this.weaponDurabilities={},this.rng=new Pt(555),this.hideTimer=0}setWeapon(t,e={}){let i=Me[t];if(!i)return!1;this.rig.clear();let n=$g(t);if(this.rig.add(n),this.model=n,this.current=t,this.def=i,this.state.mag=e.mag??Math.min(i.mag||1,this.game.inventory.countAmmo(i.reserveType)),i.type!=="melee"&&i.type!=="bow"){let s=i.mag||8;this.state.mag=Math.min(e.mag??s,s)}else i.type==="bow"&&(this.state.mag=this.game.inventory.countAmmo(i.reserveType)>0?1:0);return this.state.reserve=this.game.inventory.countAmmo(i.reserveType),this.state.durability=this.weaponDurabilities[t]??1,this.state.reloading=!1,this.state.fireT=0,this.state.recoil=0,this.state.spread=0,this.state.jammed=!1,this.type=i.type,this.isMelee=i.type==="melee",this.attachments=this.game.inventory.attachments[t]||{},this.viewModel.visible=this.game.cameraMode===1||this.game.player.aiming||!0,!0}get ammoText(){return this.def?this.isMelee?"\u2014":this.def.type==="bow"?`${this.state.mag?1:0} / ${this.game.inventory.countAmmo(this.def.reserveType)}`:`${this.state.mag} / ${this.state.reserve}`:""}get ammoFrac(){return!this.def||this.isMelee?0:Z(this.state.mag/(this.def.mag||1),0,1)}reload(){if(!this.def||this.isMelee||this.state.reloading)return;let t=this.game.inventory.countAmmo(this.def.reserveType),e=this.def.mag||1;if(t<=0||this.state.mag>=e){this.game.audio.dryFire();return}this.state.reloading=!0,this.state.reloadT=0,this.state.reloadDur=this.def.reload*(1+(this.attachments.receiver?-.05:0))*(this.game.player.skills.reload?1+this.game.player.skills.reload:1),this.game.audio.reload(0)}finishReload(){let t=(this.def.mag||1)-this.state.mag,e=this.game.inventory.countAmmo(this.def.reserveType),i=Math.min(t,e);i>0&&(this.game.inventory.removeAmmo(this.def.reserveType,i),this.state.mag+=i,this.state.reserve=this.game.inventory.countAmmo(this.def.reserveType),this.game.audio.reload(1),this.game.audio.shellDrop()),this.state.reloading=!1,this.game.ui.updateWeapon()}fire(t,e){let i=this.game.player;if(!this.def||this.state.fireT>0||this.state.reloading)return!1;if(this.isMelee)return this.meleeAttack();if(this.state.jammed)return this.game.audio.dryFire(),this.state.jammed=!1,this.game.notify("Weapon jammed \u2014 cleared"),!1;if(this.state.mag<=0)return this.game.audio.dryFire(),this.game.inventory.countAmmo(this.def.reserveType)>0?this.reload():this.game.notify("Out of ammunition"),!1;if(this.state.durability<=0)return this.game.notify("Weapon broken \u2014 needs repair"),!1;let n=this.def;this.state.mag--,this.state.fireT=1/((n.rate||1)*(this.attachments.receiver?1.12:1)*(this.game.player.skills.rate||1)),this.state.lastShot=this.game.time,this.state.durability=Math.max(0,this.state.durability-(n.type==="bow"?.0015:.0042)),this.weaponDurabilities[this.current]=this.state.durability,this.state.durability<.35&&this.rng.chance(.02)&&(this.state.jammed=!0,this.game.notify("The weapon jams."));let s=(1+(this.game.player.skills.recoil||0))*(this.attachments.suppressor?.65:1),r=(n.recoil||1)*.011*s,o=1+(this.game.player.skills.accuracy||0),l=(n.spread||1)*(this.game.player.aiming?.35:1)*(1-(this.attachments.scope_small?.25:0))*(1-(this.attachments.scope_medium?.45:0))*(1+this.state.spread)/o;this.game.player.moving&&(l*=1.5),this.game.player.crouching&&(l*=.75),this.game.player.sprinting&&(l*=2.4),this.state.spread=Math.min(1.4,this.state.spread+.22),this.game.player.pitch+=r*(.7+this.rng.next()*.6),this.game.player.yaw+=(this.rng.next()-.5)*r*.6,this.state.recoil=Math.min(1.2,this.state.recoil+.55),i.addShake(Z((n.recoil||1)*.055,.02,.35));let c=!!this.attachments.suppressor||!!n.silent,h=n.type==="pistol"?"pistol":n.type==="shotgun"?"shotgun":n.type==="rifle"?"rifle":n.type==="smg"?"smg":"bow";this.game.audio.gunshot(h,i.eyePos,c),this.game.alertEnemiesToNoise(i.pos.x,i.pos.z,c?.35:1,55);let d=new P;this.muzzle.getWorldPosition(d);let u=t.clone(),f=n.pellets||1,g=(n.dmg||10)*(this.attachments.suppressor?.9:1)*(this.game.player.damageMul||1);for(let y=0;y<f;y++){let p=l*Math.PI/180*1,m=u.clone();m.x+=(this.rng.next()-.5)*2*p,m.y+=(this.rng.next()-.5)*2*p,m.z+=(this.rng.next()-.5)*2*p,m.normalize(),this.game.combat.hitscan(d,m,g,{weapon:this.current,penetration:n.type==="rifle"?.35:.1,range:n.range||100,silent:!!n.silent,crit:(n.crit||.06)+(this.game.player.skills.critDmg||0)})}return this.game.vfx.muzzleFlash(d,u),this.flashLight.intensity=8,this.flashTimer=.05,this.game.ui.updateWeapon(),this.state.mag===0&&this.game.inventory.countAmmo(this.def.reserveType)>0&&!n.auto&&setTimeout(()=>{!this.state.reloading&&this.state.mag===0&&this.reload()},300),!0}meleeAttack(){let t=this.game.player,e=this.def;if(t.stamina<(e.stam||5)*.5)return this.game.notify("Too exhausted to swing"),!1;t.stamina-=(e.stam||5)*(1+(this.game.player.skills.meleeDmg?-.1:0)),this.state.fireT=1/(e.rate||1),this.state.meleeT=.36,this.game.audio.swing();let i=(e.dmg||20)*(this.game.player.skills.meleeDmg?1+this.game.player.skills.meleeDmg:1)*(this.game.player.damageMul||1);return this.game.combat.meleeSwing(i,e.range||2,e.crit||.1),this.state.durability=Math.max(0,this.state.durability-.002),this.weaponDurabilities[this.current]=this.state.durability,this.game.ui.updateWeapon(),!0}update(t,e,i){if(!this.def)return;let n=this.game.player;if(this.state.fireT=Math.max(0,this.state.fireT-t),this.state.spread=Math.max(0,this.state.spread-t*1.6),this.state.recoil=Math.max(0,this.state.recoil-t*3.2),this.state.meleeT=Math.max(0,this.state.meleeT-t),this.state.aimBlend=He(this.state.aimBlend,n.aiming?1:0,12,t),this.state.reloading&&(this.state.reloadT+=t,this.state.reloadT>=this.state.reloadDur&&this.finishReload()),(this.isMelee?i.left&&this.state.fireT<=0:this.def.auto?i.left:i.leftPressed)&&!this.game.ui.isBlockingInput()){let p=n.eyePos,m=n.forward.clone(),x=p.clone().addScaledVector(m,120),b=this.game.world.colliders.raycast(p.x,p.y,p.z,m.x,m.y,m.z,120);b&&x.copy(b.point);let _=this.game.combat.aimRaycast(p,m,b?b.dist:120);_&&x.copy(_.point),this.fire(m,x)}e.KeyR&&!this.game.ui.isBlockingInput()&&this.reload();let r=this.rig,o=Math.hypot(n.vel.x,n.vel.z);this.state.bobT+=t*(n.sprinting?12:8)*Z(o/4,0,1.2);let l=Math.sin(this.state.bobT)*.012*Z(o/4,0,1),c=Math.abs(Math.cos(this.state.bobT))*.01*Z(o/4,0,1),h=-i.dx*7e-4,d=-i.dy*7e-4;this.state.swayX=He(this.state.swayX,h,8,t),this.state.swayY=He(this.state.swayY,d,8,t);let u=this.state.aimBlend,g=(this.game.cameraMode===1?new P(.18-u*.18,-.18+u*.03,-.34+u*.16):new P(.26-u*.16,-.24+u*.04,-.42+u*.12)).clone();if(g.x+=l+this.state.swayX,g.y+=c+this.state.swayY+this.state.recoil*.03,g.z+=this.state.recoil*.05,this.state.reloading){let p=this.state.reloadT/this.state.reloadDur;g.y-=Math.sin(p*Math.PI)*.18,g.z+=Math.sin(p*Math.PI)*.06}if(this.state.switching>0&&(g.y-=this.state.switching*.5,this.state.switching=Math.max(0,this.state.switching-t*4)),this.state.meleeT>0){let p=1-this.state.meleeT/.36;g.x-=Math.sin(p*Math.PI)*.22,g.z-=Math.sin(p*Math.PI)*.3}r.position.lerp(g,1-Math.exp(-t*22)),r.rotation.set(-this.state.recoil*.14+this.state.swayY*2.2,this.state.swayX*2.4+(this.state.meleeT>0?-Math.sin((1-this.state.meleeT/.36)*Math.PI)*.8:0),-this.state.swayX*1.2+(this.state.meleeT>0?Math.sin((1-this.state.meleeT/.36)*Math.PI)*.5:0));let y=n.cameraMode!==1&&!n.aiming&&this.game.camera.position.distanceTo(n.eyePos)<1.2;this.viewModel.visible=!y,this.flashTimer>0?(this.flashTimer-=t,this.flashLight.intensity=Math.max(0,this.flashTimer/.05)*8):this.flashLight.intensity=0,this.attachments.flashlight&&this.game.flashlight&&(this.game.flashlight.visible=!0),this.rig.userData.aimBlend=u}get weaponName(){return this.def?this.def.name:"Unarmed"}};var ir=class{constructor(t){this.game=t,this.rng=new Pt(1717),this.projectiles=[],this.hitMarkers=[],this.projGeo=new Ei(.09,8,6),this.hitMarkerEl=null}raySphere(t,e,i,n){let s=i.clone().sub(t),r=s.dot(e);if(r<0)return null;let o=s.lengthSq()-r*r;if(o>n*n)return null;let l=Math.sqrt(n*n-o);return r-l}aimRaycast(t,e,i=120){let n=null,s=i;for(let r of this.game.enemies){if(r.dead)continue;let o=r.center,l=this.raySphere(t,e,o,r.radius+(r.isBoss?1.6:.55));l!==null&&l<s&&(s=l,n={enemy:r,dist:l,point:t.clone().addScaledVector(e,l)})}return n}hitscan(t,e,i,n={}){let r=this.game.world.colliders.raycast(t.x,t.y,t.z,e.x,e.y,e.z,n.range||120),o=r?r.dist:n.range||120,l=null,c=o;for(let d of this.game.enemies){if(d.dead)continue;let u=d.center.clone().add(new P(0,d.height*.38,0)),f=d.center.clone(),g=(d.isBoss?.85:.3)*(d.def.scale||1),y=(d.isBoss?1.5:.55)*(d.def.scale||1),p=this.raySphere(t,e,u,g),m=this.raySphere(t,e,f,y),x=p!==null&&m!==null?Math.min(p,m):p!==null?p:m;x!==null&&x>.2&&x<c&&(c=x,l={enemy:d,head:p!==null&&p<=(m??1e9),point:t.clone().addScaledVector(e,x)})}let h=t.clone().addScaledVector(e,l?c:o);if(n.noTracer||this.game.vfx.tracer(t,h,n.silent?10143999:16765072),l){let d=l.enemy,u=i*(l.head?n.crit?2.4+n.crit:2.4:1),f=d.hurt(u,{penetration:n.penetration||0,head:l.head});return this.game.vfx.bloodBurst(l.point,e,l.head?22:12,l.head?1.3:1),this.game.vfx.addDecal("blood",l.point,e.clone().negate()),this.game.audio.hitBody(d.pos),this.game.onHitEnemy(d,f,l.head),this.showHitMarker(l.head),{hit:!0,enemy:d,point:l.point,damage:f,head:l.head}}if(r){let d=r.collider,u=d.tag==="metal"||d.tag==="pipe"||d.tag==="tank"||d.tag==="chimney"?"metal":d.tag==="tree"||d.tag==="log"?"wood":d.tag==="vehicle"||d.tag==="wagon"?"metal":"concrete",f=e.clone().negate();return this.game.vfx.impact(r.point,f,u),this.game.audio.playNoise({freq:u==="metal"?2600:1e3,q:2,dur:.12,volume:.18,pos:r.point,maxDist:40}),this.game.alertEnemiesToNoise(r.point.x,r.point.z,.4,25),{hit:!0,world:!0,point:r.point,damage:0}}return{hit:!1}}showHitMarker(t){this.game.ui&&this.game.ui.hitMarker(t)}meleeSwing(t,e,i){let n=this.game.player,s=n.eyePos,r=n.flatForward;this.game.vfx.meleeArc(n.pos,n.yaw,e);let o=!1;for(let c of this.game.enemies){if(c.dead)continue;let h=new P(c.pos.x-n.pos.x,0,c.pos.z-n.pos.z);if(h.length()>e+c.radius+.4||(h.normalize(),h.dot(r)<.35))continue;let u=this.rng.chance(i),f=t*(u?2.2:1),g=c.hurt(f,{head:u}),y=c.center.clone();this.game.vfx.bloodBurst(y,r,16,1.1),this.game.audio.meleeHit(c.pos,t>40),this.game.onHitEnemy(c,g,u),this.showHitMarker(u),o=!0}let l=this.game.world.colliders.raycast(s.x,s.y,s.z,r.x,0,r.z,e);return l&&!o?(this.game.vfx.impact(l.point,new P(-r.x,.2,-r.z),"concrete"),this.game.audio.meleeHit(l.point,!1)):o||this.game.audio.swing(),o&&(n.addShake(.12),this.game.hitStop=.045),o}spawnProjectile(t,e,i={}){let n=e.clone().sub(t).normalize(),s=i.speed||25,r=new At(this.projGeo,new Ce({color:i.color||10148095,transparent:!0,opacity:.9,blending:Oi,depthWrite:!1}));r.scale.setScalar((i.radius||.12)/.09),r.position.copy(t),this.game.scene.add(r);let o=new Ke(i.color||10148095,2.2,6,2);return o.position.copy(t),this.game.scene.add(o),this.projectiles.push({mesh:r,light:o,pos:t.clone(),dir:n,speed:s,life:i.life||4,damage:i.damage||15,owner:i.owner||"enemy",radius:i.radius||.16,gravity:i.gravity||0,onHit:i.onHit,trail:i.trail!==!1}),r}update(t){for(let e=this.projectiles.length-1;e>=0;e--){let i=this.projectiles[e];i.life-=t,i.dir.y+=i.gravity*t;let n=i.speed*t,s=i.pos.clone().addScaledVector(i.dir.normalize(),n),r=!1,o=this.game.world.colliders.raycast(i.pos.x,i.pos.y,i.pos.z,i.dir.x,i.dir.y,i.dir.z,n+.1);if(o&&(r={point:o.point,tag:o.collider.tag}),!r&&i.owner==="enemy"){let l=this.game.player,c=new P(l.pos.x,l.pos.y+1,l.pos.z);(s.distanceTo(c)<.75||i.pos.distanceTo(c)<1)&&(r={point:c,player:!0})}if(!r&&i.owner==="player"){for(let l of this.game.enemies)if(!l.dead&&s.distanceTo(l.center)<l.radius+.5){r={point:l.center.clone(),enemy:l};break}}if(r){if(r.player)this.game.player.applyDamage(i.damage,{body:"torso",bleed:6}),this.game.vfx.bloodBurst(r.point,i.dir.clone().negate(),12),this.game.audio.hitBody(r.point);else if(r.enemy){let l=r.enemy.hurt(i.damage,{});this.game.vfx.bloodBurst(r.point,i.dir,14),this.game.audio.hitBody(r.point),this.game.onHitEnemy(r.enemy,l,!1)}else this.game.vfx.impact(r.point,i.dir.clone().negate(),r.tag==="metal"?"metal":"concrete"),this.game.vfx.spawn(r.point.clone(),{mat:this.game.vfx.mats.flash,geo:this.game.vfx.spriteGeo,vel:new P,life:.15,size:.6,gravity:0,drag:4});this.removeProjectile(e);continue}i.pos.copy(s),i.mesh.position.copy(i.pos),i.light.position.copy(i.pos),i.trail&&Math.random()<.55&&this.game.vfx.spawn(i.pos.clone(),{mat:this.game.vfx.mats.glow,geo:this.game.vfx.spriteGeo,vel:new P((Math.random()-.5)*.2,(Math.random()-.5)*.2,(Math.random()-.5)*.2),life:.3,size:.1,gravity:0,drag:2,grow:.6}),i.life<=0&&this.removeProjectile(e)}}removeProjectile(t){let e=this.projectiles[t];this.game.scene.remove(e.mesh),this.game.scene.remove(e.light),e.mesh.material.dispose(),this.projectiles.splice(t,1)}clear(){for(let t=this.projectiles.length-1;t>=0;t--)this.removeProjectile(t)}};var Yg=10,jg=7,wc=1,nr=class{constructor(t){this.game=t,this.cols=Yg,this.rows=jg,this.items=[],this.equipment={head:null,body:null,back:null,light:null,utility:null,weapon1:null,weapon2:null,melee:null},this.attachments={},this.baseCarry=45,this.gold=0,this.quickSlots=[null,null,null,null]}get carryCapacity(){let t=this.baseCarry+(this.game.player?.skills?.carry||0);for(let e of Object.values(this.equipment)){if(!e)continue;let i=Bi(e.id);i?.carry&&(t+=i.carry)}return t}get weight(){let t=0;for(let e of this.items)t+=fc(e.id)*e.qty;for(let e of Object.values(this.equipment))e&&(t+=fc(e.id)+(e.attachments?Object.keys(e.attachments).length*.3:0));return t}get overloaded(){return this.weight>this.carryCapacity}occupancy(t=null){let e=new Array(this.cols*this.rows).fill(null);for(let i of this.items){if(i===t)continue;let[n,s]=this.dims(i);for(let r=0;r<s;r++)for(let o=0;o<n;o++){let l=i.x+o,c=i.y+r;l>=0&&c>=0&&l<this.cols&&c<this.rows&&(e[c*this.cols+l]=i)}}return e}dims(t){let[e,i]=wa(t.id);return t.rot?[i,e]:[e,i]}canPlace(t,e,i,n=!1){let[s,r]=wa(t.id),o=n?r:s,l=n?s:r;if(e<0||i<0||e+o>this.cols||i+l>this.rows)return!1;let c=this.occupancy(t);for(let h=0;h<l;h++)for(let d=0;d<o;d++)if(c[(i+h)*this.cols+(e+d)])return!1;return!0}findSpot(t){let[e,i]=wa(t.id);for(let n of[!1,!0]){let s=n?i:e,r=n?e:i;for(let o=0;o<=this.rows-r;o++)for(let l=0;l<=this.cols-s;l++)if(this.canPlace(t,l,o,n))return{x:l,y:o,rot:n}}return null}add(t,e=1,i={}){let n=Bi(t)||Me[t];if(!n)return 0;let s=!!Me[t],r=s?1:n.stack||1,o=0;if(r>1)for(let c of this.items){if(c.id!==t)continue;let h=r-c.qty;if(h<=0)continue;let d=Math.min(h,e-o);if(c.qty+=d,o+=d,o>=e)break}let l=0;for(;o<e&&l++<200;){let c={uid:wc++,id:t,qty:Math.min(r,e-o),durability:s?1:void 0,attachments:s?{}:void 0,x:0,y:0,rot:!1},h=this.findSpot(c);if(!h)break;c.x=h.x,c.y=h.y,c.rot=h.rot,this.items.push(c),o+=c.qty}return o>0&&this.game?.audio&&this.game.audio.pickup(),o}removeUid(t,e=999){let i=this.items.findIndex(r=>r.uid===t);if(i<0)return 0;let n=this.items[i],s=Math.min(e,n.qty);return n.qty-=s,n.qty<=0&&this.items.splice(i,1),s}count(t){let e=0;for(let i of this.items)i.id===t&&(e+=i.qty);return e}countAmmo(t){if(!t)return 0;let e=0;for(let i of this.items)i.id===t&&(e+=i.qty);return e}removeAmmo(t,e){let i=e;for(let n=this.items.length-1;n>=0&&i>0;n--){let s=this.items[n];if(s.id!==t)continue;let r=Math.min(s.qty,i);s.qty-=r,i-=r,s.qty<=0&&this.items.splice(n,1)}return e-i}useItem(t){let e=this.items.findIndex(r=>r.uid===t);if(e<0)return!1;let i=this.items[e],n=Bi(i.id);if(!n||!n.use)return!1;let s=this.game.applyConsumable(n);return s&&(i.qty--,i.qty<=0&&this.items.splice(e,1),this.game.audio&&this.game.audio.pickup()),s}equip(t){let e=this.items.findIndex(r=>r.uid===t);if(e<0)return!1;let i=this.items[e],n=Bi(i.id),s=Me[i.id];if(s){let r="weapon1";s.type==="melee"?r="melee":this.equipment.weapon1?this.equipment.weapon2?r="weapon1":r="weapon2":r="weapon1";let o=this.equipment[r];return this.items.splice(e,1),this.items.push(i),this.equipment[r]={...i,slot:r,equipped:!0},this.removeUid(i.uid),o&&this.addBackFromSlot(o),this.game.weapons&&this.game.weapons.setWeapon(i.id),!0}if(n&&n.slot){let r=n.slot,o=this.equipment[r];return this.removeUid(i.uid),o&&this.addBackFromSlot(o),this.equipment[r]={...i,equipped:!0},this.game.audio&&this.game.audio.uiClick(),this.recalcEquipment(),!0}return!1}addBackFromSlot(t){let e={uid:wc++,id:t.id,qty:t.qty||1,x:0,y:0,rot:!1,durability:t.durability,attachments:t.attachments},i=this.findSpot(e);return i&&(e.x=i.x,e.y=i.y,e.rot=i.rot,this.items.push(e)),!!i}unequip(t){let e=this.equipment[t];return e?(this.equipment[t]=null,this.addBackFromSlot(e),this.recalcEquipment(),!0):!1}recalcEquipment(){let t=this.game.player,e=0,i=0;for(let[n,s]of Object.entries(this.equipment)){if(!s)continue;let r=Bi(s.id);r&&(r.armor&&(e+=r.armor*(1+(t.skills?.armor||0))),r.radResist&&(i=Math.max(i,r.radResist)))}t.armorValue=e,t.armorRadRes=i,this.game.ui&&this.game.ui.updateEquipment()}moveItem(t,e,i,n){let s=this.items.find(o=>o.uid===t);if(!s)return!1;let r={x:s.x,y:s.y,rot:s.rot};return s.x=e,s.y=i,n!==void 0&&(s.rot=n),this.canPlace(s,e,i,s.rot)?!0:(s.x=r.x,s.y=r.y,s.rot=r.rot,!1)}sortItems(){let t={weapons:0,ammo:1,food:2,water:3,medicine:4,armor:5,equipment:6,materials:7,electronics:8,quest:9},e=n=>{let s=Bi(n);return Me[n]?0:t[s?.cat]??8};this.items.sort((n,s)=>e(n.id)-e(s.id)||n.id.localeCompare(s.id));for(let n of this.items)n.x=0,n.y=0,n.rot=!1;let i=[];for(let n of this.items){this.items=this.items.filter(r=>r!==n);let s=this.findSpot(n);s&&(n.x=s.x,n.y=s.y,n.rot=s.rot),i.push(n),this.items=[...i,...this.items.filter(r=>r!==n)]}this.items=i}dropItem(t){let e=this.items.find(i=>i.uid===t);return e?(this.removeUid(t,9999),e):null}totalValue(){let t=0;for(let e of this.items){let i=Bi(e.id);t+=(i?.value||0)*e.qty}return t}serialize(){return{items:this.items.map(t=>({...t})),equipment:Object.fromEntries(Object.entries(this.equipment).map(([t,e])=>[t,e?{...e}:null])),attachments:JSON.parse(JSON.stringify(this.attachments)),gold:this.gold,quickSlots:[...this.quickSlots]}}deserialize(t){t&&(this.items=(t.items||[]).map(e=>({...e,uid:wc++})),this.equipment=t.equipment||this.equipment,this.attachments=t.attachments||{},this.gold=t.gold||0,this.quickSlots=t.quickSlots||[null,null,null,null],this.recalcEquipment())}};var bd=[{n:1,name:"AWAKENING",color:"#8a9a7a",desc:"You wake up seven metres under the world with a broken flashlight and a note in your brother's handwriting."},{n:2,name:"THE DEAD SUBURBS",color:"#9a8a6a",desc:"Twelve identical streets. One of them still has people on it."},{n:3,name:"THE FOREST SIGNAL",color:"#6a8a6a",desc:"Blackwood swallowed the road. Something in the fog is repeating a recording of your own voice."},{n:4,name:"INDUSTRIAL SECRETS",color:"#8a7a5a",desc:"The foundry never stopped running. Nobody has fed it in four years."},{n:5,name:"THE FORGOTTEN CITY",color:"#6a7a8a",desc:"The hospital generators still hum. Somebody is keeping the lights on for a reason."},{n:6,name:"THE EXCLUSION ZONE",color:"#6a6a6a",desc:"Checkpoints facing inward. Orders dated after everyone was dead."},{n:7,name:"THE RED WASTELAND",color:"#9a5a4a",desc:"The crater is still warm. Ash falls upward on the bad nights."},{n:8,name:"THE LAST SIGNAL",color:"#7a5a9a",desc:"Fourteen point seven kilohertz. It has been saying your name for years."}],X=(a,t={})=>{if(a==="kill"&&t.type){let{type:e,...i}=t;return{type:"kill",mutant:e,...i}}return{type:a,...t}},ot=(a,t={},e=0,i={})=>({xp:a,items:t,money:e,...i}),bs=[{id:"m01",act:1,name:"Cold Start",giver:null,desc:"The shelter is dark and the air is stale. Find a working light and understand where you are.",objectives:[X("interact",{id:"shelter_locker",desc:"Search the shelter lockers"}),X("interact",{id:"shelter_console",desc:"Read the radio console"})],rewards:ot(120,{battery:2,bandage:2,water_bottle:1}),onComplete:"The radio speaks in your brother's voice. It has been broadcasting for six years."},{id:"m02",act:1,name:"The Note",giver:null,desc:"There is a note pinned to the bunk above yours. Read it.",objectives:[X("interact",{id:"shelter_note",desc:"Read Mikhail's note"})],prereq:["m01"],rewards:ot(150,{knife:1,crackers:2})},{id:"m03",act:1,name:"Seven Metres Up",giver:null,desc:"The stairwell leads to a surface hatch. Get out of Shelter 12.",objectives:[X("reach",{poi:"sub_shelter",desc:"Reach the surface hatch"})],prereq:["m02"],rewards:ot(200,{flashlight:1})},{id:"m04",act:1,name:"First Light",giver:null,desc:"The suburbs stretch out under a grey sky. Find the nearest sign of people.",objectives:[X("explore",{pois:["sub_camp","sub_school"],desc:"Discover the camp and the school"})],prereq:["m03"],rewards:ot(260,{water_bottle:2,jerky:2})},{id:"m05",act:1,name:"Anything That Breathes",giver:null,desc:"Something is moving between the houses. Deal with it before it deals with you.",objectives:[X("killany",{count:3,desc:"Kill 3 mutants"})],prereq:["m04"],rewards:ot(320,{ammo_9mm:12,pistol:1},40)},{id:"m06",act:2,name:"Hollow Street",giver:"nika",desc:"Nika runs the camp on Hollow Street. She wants to know what you are before she lets you inside.",objectives:[X("talk",{npc:"nika",desc:"Speak with Nika Volkova"})],prereq:["m05"],rewards:ot(300,{},60)},{id:"m07",act:2,name:"Water Runs",giver:"nika",desc:"The camp pump is dry and the crawlers nest in the school basement. Nika needs the valve turned at Ravenwood Elementary.",objectives:[X("reach",{poi:"sub_school",desc:"Enter Ravenwood Elementary"}),X("kill",{type:"crawler",count:4,desc:"Clear the crawlers from the basement"}),X("interact",{id:"school_valve",desc:"Turn the water valve"})],prereq:["m06"],rewards:ot(420,{water_purified:3},90)},{id:"m08",act:2,name:"The Scavenger's Debt",giver:"nika",desc:"A scavenger named Doran never came back from the Hollis fuel station. Nika wants him found \u2014 or his pack.",objectives:[X("reach",{poi:"sub_gas",desc:"Search the fuel station"}),X("collect",{item:"dogtag",count:1,desc:"Find Doran's dog tags"})],prereq:["m07"],rewards:ot(380,{backpack_small:1,ammo_9mm:18},120)},{id:"m09",act:2,name:"The Choir",giver:null,desc:"Nika says the Hollow gather in the old church at night, and that something down there has been organising them.",objectives:[X("reach",{poi:"sub_church",desc:"Enter St. Agnes Church"}),X("kill",{type:"hollow",count:5,desc:"Survive the congregation"})],prereq:["m08"],rewards:ot(600,{medkit:2,ammo_12g:8},200)},{id:"m10",act:2,name:"THE HOLLOW KING",giver:null,desc:"It wears a crown of jawbones and it knows the sound of your breathing.",objectives:[X("boss",{boss:"hollow_king",desc:"Defeat the Hollow King"})],prereq:["m09"],rewards:ot(1400,{warden_coat:1,signal_core:1,medkit:2},500),onComplete:"The crown comes apart in your hands. The signal gets louder."},{id:"m11",act:3,name:"Blackwood",giver:null,desc:"The forest north of the highway is the shortest route to the signal source. It is also where the recordings come from.",objectives:[X("reach",{poi:"for_cabin",desc:"Find the hunter's cabin"}),X("kill",{type:"stalker",count:2,desc:"Kill 2 Stalkers"})],prereq:["m10"],rewards:ot(700,{hunting_rifle:1,ammo_762:15},150)},{id:"m12",act:3,name:"Research Post",giver:"anders",desc:"Doctor Anders survived in the Blackwood research post. He has been recording the signal for years.",objectives:[X("talk",{npc:"anders",desc:"Speak with Doctor Anders"})],prereq:["m11"],rewards:ot(500,{geiger:1,antirad:2},80)},{id:"m13",act:3,name:"The Recordings",giver:"anders",desc:"Three tape reels are buried in the mine adit. Anders needs them to decode the signal.",objectives:[X("reach",{poi:"for_tunnel",desc:"Enter Mine Adit 4"}),X("collect",{item:"record_tape",count:3,desc:"Recover 3 tape reels"})],prereq:["m12"],rewards:ot(650,{electronics:2,filter:2},120)},{id:"m14",act:3,name:"The Nest",giver:"anders",desc:"The tapes are covered in web. Something is breeding in the low ground and it does not want the reels leaving.",objectives:[X("reach",{poi:"for_nest",desc:"Reach the nest clearing"}),X("kill",{type:"crawler",count:6,desc:"Kill 6 brood crawlers"})],prereq:["m13"],rewards:ot(800,{medkit:3,stim_combat:2},200)},{id:"m15",act:3,name:"THE FOREST MATRIARCH",giver:null,desc:"She was here before the forest. Everything in the nest is hers.",objectives:[X("boss",{boss:"forest_matriarch",desc:"Defeat the Forest Matriarch"})],prereq:["m14"],rewards:ot(1800,{crossbow:1,ammo_bolt:12,warden_coat:1},600),onComplete:"Anders decodes the tapes: a voice repeating coordinates. The coordinates are the foundry."},{id:"m16",act:4,name:"Down the Line",giver:null,desc:"The foundry is still running. Somebody is feeding it.",objectives:[X("reach",{poi:"ind_depot",desc:"Reach the rail depot"}),X("reach",{poi:"ind_camp",desc:"Find the scrapper camp"})],prereq:["m15"],rewards:ot(700,{gasmask:1,filter:2},150)},{id:"m17",act:4,name:"Scrappers",giver:null,desc:"The scrappers trade in machine parts. They want the power plant unlocked before they talk.",objectives:[X("reach",{poi:"ind_power",desc:"Reach Kolmogor Power Plant"}),X("kill",{type:"brute",count:1,desc:"Kill a Brute inside the plant"})],prereq:["m16"],rewards:ot(850,{ammo_762:20,duct_tape:3},180)},{id:"m18",act:4,name:"Cooling Towers",giver:null,desc:"The plant runs on something that is not diesel. The towers vent green.",objectives:[X("collect",{item:"artifact_shard",count:2,desc:"Recover 2 resonance shards"}),X("reach",{poi:"ind_warehouse",desc:"Search Warehouse 12"})],prereq:["m17"],rewards:ot(900,{hazmat_suit:1,antirad:3},260)},{id:"m19",act:4,name:"The Forge Wakes",giver:null,desc:"The foundry pit answers to a machine that grew arms.",objectives:[X("reach",{poi:"ind_foundry",desc:"Enter the foundry pit"}),X("kill",{type:"brute",count:3,desc:"Kill 3 Brutes"})],prereq:["m18"],rewards:ot(1200,{ammo_12g:16,medkit:2},300)},{id:"m20",act:4,name:"THE IRON ABOMINATION",giver:null,desc:"A forging machine that grew hungry, then grew arms.",objectives:[X("boss",{boss:"iron_abomination",desc:"Defeat the Iron Abomination"})],prereq:["m19"],rewards:ot(2400,{assault_rifle:1,ammo_762:40,kevlar_vest:1},900),onComplete:"Inside its chest: a Warden badge, still warm. The signal points south. The city."},{id:"m21",act:5,name:"Street Level",giver:null,desc:"Six floors of apartments and nobody in them. The hospital lights are on.",objectives:[X("reach",{poi:"city_market",desc:"Reach Vostok Supermarket"}),X("reach",{poi:"city_school",desc:"Search Kirov Secondary"})],prereq:["m20"],rewards:ot(900,{canned_food:4,water_purified:4},200)},{id:"m22",act:5,name:"Precinct 9",giver:null,desc:"The police station has the city's last working radio. And its last working lockers.",objectives:[X("reach",{poi:"city_police",desc:"Enter Precinct 9"}),X("collect",{item:"keycard",count:1,desc:"Find a ZONE keycard"})],prereq:["m21"],rewards:ot(950,{revolver:1,ammo_38:18},250)},{id:"m23",act:5,name:"St. Agnes General",giver:"yelena",desc:"Yelena has held the hospital for three weeks. She is not a doctor. She is a radio operator, and she has been listening.",objectives:[X("talk",{npc:"yelena",desc:"Speak with Yelena"})],prereq:["m22"],rewards:ot(800,{medkit:3,antibiotics:2},150)},{id:"m24",act:5,name:"The Sixth Floor",giver:"yelena",desc:"The generator on the sixth floor needs fuel. The stairwell is not empty.",objectives:[X("reach",{poi:"city_hospital",desc:"Reach the hospital roof"}),X("collect",{item:"fuel",count:2,desc:"Deliver 2 fuel canisters"}),X("kill",{type:"screamer",count:2,desc:"Silence 2 Screamers"})],prereq:["m23"],rewards:ot(1100,{ammo_762:30,stim_combat:2},300)},{id:"m25",act:5,name:"Metro Line 2",giver:"yelena",desc:"The subway tunnels run under the exclusion zone wall. Yelena knows a way through.",objectives:[X("reach",{poi:"city_subway",desc:"Enter Metro Line 2"}),X("kill",{type:"burrower",count:3,desc:"Kill 3 Burrowers in the tunnels"})],prereq:["m24"],rewards:ot(1300,{flashlight_hd:1,ammo_bolt:10},300)},{id:"m26",act:6,name:"Facing Inward",giver:null,desc:"Every checkpoint on the perimeter faces the wrong way. Whatever they were keeping out, they failed.",objectives:[X("reach",{poi:"mil_camp",desc:"Reach Forward Post Delta"}),X("kill",{type:"hollow",count:8,desc:"Clear 8 Hollow at the perimeter"})],prereq:["m25"],rewards:ot(1400,{kevlar_vest:1,medkit:2},350)},{id:"m27",act:6,name:"Kravchuk",giver:"kravchuk",desc:"Sergeant Kravchuk has been holding the armory for four years. He still takes orders from a commander who no longer exists.",objectives:[X("talk",{npc:"kravchuk",desc:"Speak with Sergeant Kravchuk"})],prereq:["m26"],rewards:ot(1e3,{dogtag:3,ammo_12g:20},200)},{id:"m28",act:6,name:"Orders Dated After",giver:"kravchuk",desc:"Kravchuk needs the last written order, sealed in Barracks C. It is dated eleven months after the evacuation.",objectives:[X("reach",{poi:"mil_barracks",desc:"Search Barracks C"}),X("collect",{item:"record_tape",count:2,desc:"Recover 2 order tapes"})],prereq:["m27"],rewards:ot(1500,{assault_rifle:1,ammo_762:45},400)},{id:"m29",act:6,name:"Biolab K-9",giver:"kravchuk",desc:"The lab under the armory is where the Warden programme started. It never closed.",objectives:[X("reach",{poi:"mil_lab",desc:"Enter Biolab K-9"}),X("kill",{type:"stalker",count:3,desc:"Kill 3 Stalkers in the lab"}),X("collect",{item:"green_badge",count:1,desc:"Take a Warden badge"})],prereq:["m28"],rewards:ot(1700,{antibiotics:3,electronics:3},450)},{id:"m30",act:6,name:"THE PALE COMMANDER",giver:null,desc:"Someone signed orders here once. Then kept signing them.",objectives:[X("boss",{boss:"pale_commander",desc:"Defeat the Pale Commander"})],prereq:["m29"],rewards:ot(3200,{hazmat_suit:1,warden_coat:1,ammo_762:60},1200),onComplete:"His last order reads: CONTINUE BROADCAST. DO NOT ANSWER THEM."},{id:"m31",act:7,name:"Ash Country",giver:null,desc:"Beyond the wall the ground is red and the air tastes of copper.",objectives:[X("reach",{poi:"was_camp",desc:"Find the Ash Nomads"}),X("kill",{type:"contaminated",count:3,desc:"Kill 3 Contaminated"})],prereq:["m30"],rewards:ot(1600,{antirad:4,filter:3},400)},{id:"m32",act:7,name:"Mother Ash",giver:"mother_ash",desc:"The nomad elder knows what the crater is. She wants her granddaughter's shard returned first.",objectives:[X("talk",{npc:"mother_ash",desc:"Speak with Mother Ash"}),X("collect",{item:"artifact_shard",count:3,desc:"Return 3 shards to the nomads"})],prereq:["m31"],rewards:ot(1800,{hazmat_suit:1,stim_combat:3},500)},{id:"m33",act:7,name:"Mirror Lake",giver:"mother_ash",desc:"The lake is not water. The nomads wash their dead in it and then cannot remember their names.",objectives:[X("reach",{poi:"was_lake",desc:"Reach Mirror Lake"}),X("kill",{type:"pale",count:1,desc:"Kill a Pale One"})],prereq:["m32"],rewards:ot(2100,{medkit:4,ammo_bolt:15},600)},{id:"m34",act:7,name:"Excavation Site 9",giver:"mother_ash",desc:"Someone has been digging in the red ground for a long time. The hole is deeper than the crater.",objectives:[X("reach",{poi:"was_dig",desc:"Descend into Excavation Site 9"}),X("collect",{item:"signal_core",count:1,desc:"Recover a signal core"})],prereq:["m33"],rewards:ot(2400,{ammo_762:50,electronics:4},700)},{id:"m35",act:7,name:"THE CONTAMINATED TITAN",giver:null,desc:"A cooling tower that stood in the wrong place on the wrong day.",objectives:[X("boss",{boss:"contaminated_titan",desc:"Defeat the Contaminated Titan"})],prereq:["m34"],rewards:ot(4e3,{hazmat_suit:1,antirad:6,ammo_762:60},1500),onComplete:"It falls in slow motion and the ash stops falling. The array is awake."},{id:"m36",act:8,name:"The Array",giver:null,desc:"Eight pylons, one core, and a hum you can feel in your teeth.",objectives:[X("reach",{poi:"was_array",desc:"Reach the Signal Array"}),X("interact",{id:"array_console",desc:"Access the array console"})],prereq:["m35"],rewards:ot(2600,{medkit:4,stim_combat:4},800)},{id:"m37",act:8,name:"Fourteen Point Seven",giver:null,desc:"The console wants a signal core. It is very polite about it.",objectives:[X("collect",{item:"signal_core",count:1,desc:"Insert a signal core"}),X("kill",{type:"watcher",count:3,desc:"Hold the array against the Watchers"})],prereq:["m36"],rewards:ot(3e3,{ammo_762:60,ammo_12g:24},900)},{id:"m38",act:8,name:"The Voice",giver:null,desc:"It is not a recording. It has been answering you since the shelter.",objectives:[X("talk",{npc:"signal",desc:"Answer the signal"})],prereq:["m37"],rewards:ot(3200,{},0)},{id:"m39",act:8,name:"Hold the Line",giver:null,desc:"Everything in the wasteland heard the array wake up. Buy Yelena time to shut it down.",objectives:[X("killany",{count:12,desc:"Survive the swarm (12 kills)"}),X("survive",{seconds:180,desc:"Hold the array for 3 minutes"})],prereq:["m38"],rewards:ot(3800,{medkit:5,stim_combat:4},1200)},{id:"m40",act:8,name:"THE LAST SIGNAL",giver:null,desc:"It is not a creature. It is the broadcast that kept everyone listening.",objectives:[X("boss",{boss:"last_signal",desc:"End the Last Signal"})],prereq:["m39"],rewards:ot(9e3,{},5e3),onComplete:"The silence afterwards is the loudest thing you have ever heard. Then, quietly, the radio clicks on again.",finale:!0}],Zg=[{id:"s01",name:"Still Warm",giver:null,poi:"sub_camp",desc:"Someone died beside the camp fire recently. Find what they were carrying.",objectives:[X("collect",{item:"dogtag",count:2})],rewards:ot(260,{medkit:1},60)},{id:"s02",name:"The Missing Neighbour",giver:"nika",poi:"sub_camp",desc:"The Kovalchuks never came out of their house. Nika wants to know why.",objectives:[X("explore",{pois:["sub_school"]}),X("collect",{item:"record_tape",count:1})],rewards:ot(300,{cloth:4},80)},{id:"s03",name:"Rat King",giver:null,poi:"sub_gas",desc:"The fuel station cellar is a crawler nest.",objectives:[X("kill",{type:"crawler",count:5})],rewards:ot(340,{ammo_9mm:20},90)},{id:"s04",name:"Quiet Hours",giver:null,poi:"sub_school",desc:"The school lights turn on at night. Nobody knows who does it.",objectives:[X("survive",{seconds:120}),X("killany",{count:4})],rewards:ot(400,{battery:3},100)},{id:"s05",name:"Home Movies",giver:null,poi:"sub_school",desc:"A projector still runs in the auditorium, showing the same reel.",objectives:[X("interact",{id:"projector"})],rewards:ot(220,{electronics:1},50)},{id:"s06",name:"Woodcutter",giver:null,poi:"for_cabin",desc:"The hunter left traps in the trees. Some still have things in them.",objectives:[X("collect",{item:"cloth",count:6}),X("kill",{type:"stalker",count:1})],rewards:ot(420,{hunting_rifle:1,ammo_762:10},120)},{id:"s07",name:"Deep Roots",giver:null,poi:"for_tunnel",desc:"Something is growing in the adit that is not a mushroom.",objectives:[X("reach",{poi:"for_tunnel"}),X("kill",{type:"burrower",count:3})],rewards:ot(480,{mushrooms:5,antirad:2},130)},{id:"s08",name:"Missing Reel",giver:"anders",poi:"for_outpost",desc:"Anders misplaced a reel somewhere he will not talk about.",objectives:[X("kill",{type:"mimic",count:2}),X("collect",{item:"record_tape",count:1})],rewards:ot(520,{electronics:2},140)},{id:"s09",name:"Fog Line",giver:null,poi:"for_outpost",desc:"Mark the fog valley boundary with lamps so people stop walking into it.",objectives:[X("explore",{pois:["for_cabin","for_tunnel"]})],rewards:ot(360,{battery:4},90)},{id:"s10",name:"The Wardens' Cache",giver:null,poi:"for_outpost",desc:"A warden supply drop fell in the forest. The local mutants found it first.",objectives:[X("collect",{item:"green_badge",count:1}),X("killany",{count:6})],rewards:ot(700,{ammo_762:25,medkit:2},200)},{id:"s11",name:"Rust Line",giver:null,poi:"ind_depot",desc:"Get the rail yard crane running again so the scrappers can move freight.",objectives:[X("collect",{item:"fuel",count:1}),X("interact",{id:"crane_panel"})],rewards:ot(520,{scrap:8},150)},{id:"s12",name:"Tank Farm Sweep",giver:null,poi:"ind_power",desc:"Scrappers want the tank farm cleared before they siphon it.",objectives:[X("kill",{type:"hollow",count:6}),X("kill",{type:"brute",count:1})],rewards:ot(700,{gunpowder:6},200)},{id:"s13",name:"Green Water",giver:null,poi:"ind_power",desc:"Collect a contaminated sample without dying of it.",objectives:[X("collect",{item:"chemicals",count:3})],rewards:ot(480,{antirad:2},130)},{id:"s14",name:"Breaker Box",giver:null,poi:"ind_warehouse",desc:"Restore power to Warehouse 12.",objectives:[X("interact",{id:"warehouse_breaker"}),X("kill",{type:"screamer",count:1})],rewards:ot(640,{electronics:3},180)},{id:"s15",name:"Missing Crew",giver:null,poi:"ind_camp",desc:"Three scrappers went into the foundry. Their tags are still in there.",objectives:[X("collect",{item:"dogtag",count:3})],rewards:ot(560,{ammo_12g:12},160)},{id:"s16",name:"Chimney Watch",giver:null,poi:"ind_foundry",desc:"The chimney vents at night. Something climbs it.",objectives:[X("survive",{seconds:90}),X("kill",{type:"stalker",count:2})],rewards:ot(800,{stim_combat:2},220)},{id:"s17",name:"Curfew",giver:"yelena",poi:"city_hospital",desc:"Yelena needs the hospital doors barred before dark.",objectives:[X("interact",{id:"hospital_barricade"}),X("killany",{count:5})],rewards:ot(700,{medkit:2},180)},{id:"s18",name:"Pharmacy Run",giver:"yelena",poi:"city_market",desc:"Antibiotics are worth more than bullets in the city.",objectives:[X("collect",{item:"antibiotics",count:2})],rewards:ot(620,{painkillers:4},200)},{id:"s19",name:"Precinct Ledger",giver:null,poi:"city_police",desc:"The precinct ledger names every Warden in the city. Only one is still alive.",objectives:[X("collect",{item:"record_tape",count:2}),X("reach",{poi:"city_police"})],rewards:ot(660,{ammo_9mm:30},190)},{id:"s20",name:"Elevator Shaft",giver:null,poi:"city_hospital",desc:"The roof cache is only reachable from the shaft.",objectives:[X("reach",{poi:"city_hospital"}),X("kill",{type:"pale",count:1})],rewards:ot(1100,{medkit:3,artifact_shard:1},300)},{id:"s21",name:"Tunnel Rats",giver:null,poi:"city_subway",desc:"Clear Metro Line 2 for a supply run.",objectives:[X("kill",{type:"burrower",count:4})],rewards:ot(900,{ammo_bolt:12},260)},{id:"s22",name:"Apartment 4B",giver:null,poi:"city_school",desc:"Someone locked apartment 4B from the inside. Take the hinges off.",objectives:[X("reach",{poi:"city_school"}),X("collect",{item:"keycard",count:1})],rewards:ot(520,{medkit:1,cloth:5},150)},{id:"s23",name:"Overpass Nest",giver:null,poi:"city_camp",desc:"Crawlers have taken the overpass. The camp needs the route.",objectives:[X("kill",{type:"crawler",count:8})],rewards:ot(760,{ammo_9mm:25},210)},{id:"s24",name:"Rooftop Garden",giver:null,poi:"city_camp",desc:"Help the camp expand the garden before winter.",objectives:[X("build",{count:3})],rewards:ot(480,{canned_food:4},130)},{id:"s25",name:"Dying Light",giver:null,poi:"mil_camp",desc:"Kravchuk's lamp outside the post needs a battery and a spine.",objectives:[X("collect",{item:"battery",count:2}),X("interact",{id:"delta_lamp"})],rewards:ot(420,{filter:2},110)},{id:"s26",name:"Wire Cutters",giver:"kravchuk",poi:"mil_camp",desc:"Cut the old perimeter wire so refugees can pass.",objectives:[X("interact",{id:"perimeter_cut"}),X("kill",{type:"hollow",count:4})],rewards:ot(660,{ammo_9mm:20},180)},{id:"s27",name:"Armory Sweep",giver:"kravchuk",poi:"mil_armory",desc:"Something got into Armory 4. Clear it quietly.",objectives:[X("kill",{type:"stalker",count:2}),X("reach",{poi:"mil_armory"})],rewards:ot(900,{ammo_762:30},260)},{id:"s28",name:"Deaddrop",giver:null,poi:"mil_depot",desc:"A Warden deaddrop is still in supply depot 3.",objectives:[X("collect",{item:"artifact_shard",count:2}),X("killany",{count:5})],rewards:ot(1e3,{stim_combat:3},300)},{id:"s29",name:"Cold Storage",giver:null,poi:"mil_lab",desc:"The lab freezer still has samples. Anders will pay for one.",objectives:[X("collect",{item:"chemicals",count:4})],rewards:ot(880,{antirad:3},260)},{id:"s30",name:"Kravchuk's Last Round",giver:"kravchuk",poi:"mil_barracks",desc:"He wants his service revolver back from the barracks.",objectives:[X("collect",{item:"revolver",count:1})],rewards:ot(760,{ammo_38:24},220)},{id:"s31",name:"Ash Walk",giver:null,poi:"was_camp",desc:"Walk the nomad route and come back able to describe it.",objectives:[X("explore",{pois:["was_camp","was_lake","was_dig"]})],rewards:ot(900,{antirad:3},240)},{id:"s32",name:"Shard Tithe",giver:"mother_ash",poi:"was_camp",desc:"The nomads tithe shards to the lake. Collect three without waking it.",objectives:[X("collect",{item:"artifact_shard",count:3})],rewards:ot(1100,{hazmat_suit:1},320)},{id:"s33",name:"Bone Garden",giver:null,poi:"was_lake",desc:"Clear the mutant nests around Mirror Lake.",objectives:[X("kill",{type:"contaminated",count:2}),X("kill",{type:"crawler",count:4})],rewards:ot(1200,{medkit:3},340)},{id:"s34",name:"The Digger's Tool",giver:null,poi:"was_dig",desc:"The excavator's control chip is in the crater rim.",objectives:[X("collect",{item:"electronics",count:3}),X("reach",{poi:"was_crater"})],rewards:ot(1300,{electronics:4},360)},{id:"s35",name:"Night Soil",giver:null,poi:"was_camp",desc:"The nomads say the Pale One takes one of them every night.",objectives:[X("kill",{type:"pale",count:2})],rewards:ot(1600,{ammo_bolt:15},420)},{id:"s36",name:"Craft Work",giver:null,poi:"sub_camp",desc:"The camp always needs bandages.",objectives:[X("craft",{count:4})],rewards:ot(280,{cloth:6},80)},{id:"s37",name:"Sandbag Line",giver:null,poi:"mil_camp",desc:"Build defensive cover at Forward Post Delta.",objectives:[X("build",{count:2})],rewards:ot(520,{duct_tape:3},140)},{id:"s38",name:"Long Dark",giver:null,poi:"for_cabin",desc:"Survive a night in the forest without turning on a light.",objectives:[X("survive",{seconds:240})],rewards:ot(1e3,{stim_combat:2},300)},{id:"s39",name:"Gear Check",giver:null,poi:"ind_camp",desc:"The scrappers want a serviceable rifle.",objectives:[X("craft",{count:1}),X("collect",{item:"gunpowder",count:3})],rewards:ot(640,{ammo_762:20},180)},{id:"s40",name:"Sixteen Names",giver:null,poi:"sub_school",desc:"The school memorial lists sixteen names. Two are not children.",objectives:[X("collect",{item:"dogtag",count:4})],rewards:ot(700,{medkit:2},200)},{id:"s41",name:"Signal Bleed",giver:null,poi:"was_array",desc:"The array leaks signal into everything nearby. Find the source of the interference.",objectives:[X("reach",{poi:"was_array"}),X("kill",{type:"watcher",count:2})],rewards:ot(1800,{antirad:4},500)},{id:"s42",name:"The Warden Who Left",giver:null,poi:"mil_lab",desc:"One Warden resigned. His letter is in the lab archive.",objectives:[X("collect",{item:"record_tape",count:3})],rewards:ot(1400,{electronics:3},400)},{id:"s43",name:"Shelter Twelve",giver:null,poi:"sub_shelter",desc:"Return to where you woke up and read the last log entry.",objectives:[X("interact",{id:"shelter_console"}),X("reach",{poi:"sub_shelter"})],rewards:ot(500,{battery:2},120)},{id:"s44",name:"No One Comes Back",giver:null,poi:"ind_foundry",desc:"Kill three Brutes without dying once.",objectives:[X("kill",{type:"brute",count:3})],rewards:ot(1500,{kevlar_vest:1},450)},{id:"s45",name:"Hold the Light",giver:null,poi:"city_camp",desc:"Keep the rooftop beacon lit through a storm.",objectives:[X("survive",{seconds:300}),X("build",{count:1})],rewards:ot(900,{fuel:1},260)}],ka=[...bs,...Zg],sr=class{constructor(t){this.game=t,this.state={},this.flags={},this.tracked=null,this.completedCount=0,this.surviveTimers={}}get quests(){return ka}def(t){return ka.find(e=>e.id===t)}status(t){return this.state[t]?.status||"locked"}isActive(t){return this.status(t)==="active"}isDone(t){return this.status(t)==="done"}canStart(t){let e=this.def(t);if(!e||this.state[t])return!1;if(e.prereq){for(let i of e.prereq)if(!this.isDone(i))return!1}return!0}start(t){if(!this.canStart(t))return!1;let e=this.def(t);return this.state[t]={status:"active",progress:e.objectives.map(()=>0),startedAt:this.game.time},this.tracked||(this.tracked=t),this.game.ui.notifyQuest(`New ${e.act?"objective":"task"}: ${e.name}`,e.desc),this.game.audio.questUpdate(),this.game.ui.refreshJournal(),!0}complete(t){let e=this.def(t);if(!e||!this.state[t])return;this.state[t].status="done",this.completedCount++;let i=e.rewards||{};if(i.xp&&this.game.giveXP(i.xp,"quest"),i.money&&(this.game.inventory.gold+=i.money),i.items)for(let[n,s]of Object.entries(i.items))this.game.inventory.add(n,s);if(this.game.ui.notifyQuest(`Objective complete: ${e.name}`,e.onComplete||""),this.game.audio.questUpdate(),e.finale&&this.game.onFinale(),e.act){let n=this.nextAvailableMain();n&&n.id!==t&&(this.start(n.id),this.tracked===t&&(this.tracked=n.id))}else if(this.tracked===t){let n=this.nextAvailableMain();this.tracked=n?n.id:null}this.game.ui.refreshJournal(),this.game.saveGame(!0)}nextAvailableMain(){return bs.find(t=>this.canStart(t.id))}progress(t,e,i=1,n=!1){let s=this.state[t];if(!s||s.status!=="active")return;let r=this.def(t),o=r.objectives[e];if(!o)return;let l=s.progress[e],c=o.count||1;s.progress[e]=n?Math.min(c,i):Math.min(c,l+i),s.progress[e]!==l&&(o.desc&&this.game.ui.notifyObjective(r.name,o.desc,s.progress[e],c),this.game.audio.questUpdate()),s.progress.every((h,d)=>h>=(r.objectives[d].count||1))&&this.complete(t),this.game.ui.refreshJournal()}onKill(t){for(let[e,i]of Object.entries(this.state)){if(i.status!=="active")continue;this.def(e).objectives.forEach((s,r)=>{s.type==="killany"?this.progress(e,r,1):s.type==="kill"&&(!s.mutant||s.mutant===t)&&this.progress(e,r,1)})}}onBoss(t){for(let[e,i]of Object.entries(this.state)){if(i.status!=="active")continue;this.def(e).objectives.forEach((s,r)=>{s.type==="boss"&&s.boss===t&&this.progress(e,r,1,!0)})}}onReach(t){for(let[e,i]of Object.entries(this.state)){if(i.status!=="active")continue;this.def(e).objectives.forEach((s,r)=>{s.type==="reach"&&s.poi===t&&this.progress(e,r,1,!0),s.type==="explore"&&s.pois&&s.pois.includes(t)&&this.flagReached(e,r,t)})}}flagReached(t,e,i){let n=t+":"+e;this.flags[n]=this.flags[n]||{},!this.flags[n][i]&&(this.flags[n][i]=!0,this.progress(t,e,1))}onInteract(t){for(let[e,i]of Object.entries(this.state)){if(i.status!=="active")continue;this.def(e).objectives.forEach((s,r)=>{s.type==="interact"&&s.id===t&&this.progress(e,r,1,!0)})}}onTalk(t){for(let[e,i]of Object.entries(this.state)){if(i.status!=="active")continue;this.def(e).objectives.forEach((s,r)=>{s.type==="talk"&&s.npc===t&&this.progress(e,r,1,!0)})}}onCollect(){for(let[t,e]of Object.entries(this.state)){if(e.status!=="active")continue;this.def(t).objectives.forEach((n,s)=>{if(n.type!=="collect")return;let r=this.game.inventory.count(n.item);r>=(n.count||1)?this.progress(t,s,n.count||1,!0):r>(e.progress[s]||0)&&this.progress(t,s,1)})}}onCraft(t=1){for(let[e,i]of Object.entries(this.state)){if(i.status!=="active")continue;this.def(e).objectives.forEach((s,r)=>{s.type==="craft"&&this.progress(e,r,t)})}}onBuild(t=1){for(let[e,i]of Object.entries(this.state)){if(i.status!=="active")continue;this.def(e).objectives.forEach((s,r)=>{s.type==="build"&&this.progress(e,r,t)})}}update(t){for(let[e,i]of Object.entries(this.state)){if(i.status!=="active")continue;this.def(e).objectives.forEach((s,r)=>{s.type==="survive"&&(this.surviveTimers[e]=(this.surviveTimers[e]||0)+t,this.surviveTimers[e]>=s.seconds&&this.progress(e,r,s.seconds,!0))})}}trackedQuest(){if(this.tracked&&this.isActive(this.tracked))return this.def(this.tracked);let t=Object.entries(this.state).find(([,e])=>e.status==="active");return t?this.def(t[0]):null}trackedObjectives(){let t=this.trackedQuest();if(!t)return[];let e=this.state[t.id];return t.objectives.map((i,n)=>({text:i.desc||i.type,done:e.progress[n]>=(i.count||1),cur:e.progress[n],max:i.count||1,poi:i.poi,type:i.type}))}serialize(){return{state:this.state,flags:this.flags,tracked:this.tracked,completedCount:this.completedCount,surviveTimers:this.surviveTimers}}deserialize(t){t&&(this.state=t.state||{},this.flags=t.flags||{},this.tracked=t.tracked||null,this.completedCount=t.completedCount||0,this.surviveTimers=t.surviveTimers||{})}};var ie={torso:(a,t,e)=>C(a,t,e,1.1),limb:(a,t)=>rt(a,a*.86,t,8,1.1),head:a=>Je(a,12,1.1),box:(a,t,e)=>C(a,t,e,.7),cone:(a,t)=>pd(a,t,8)};function Kg(a){return vt("skin",{color:a||12622464,normalScale:.6,roughness:.86})}var Jg=2.4,en=(a,t="fabric")=>vt(t,{color:new mt(a).multiplyScalar(Jg),repeat:[1,1]});function Qg(a){let t=0,e=0;for(let h of a)t+=h.attributes.position.count,e+=h.index?h.index.count:h.attributes.position.count;let i=new Float32Array(t*3),n=new Float32Array(t*3),s=new Float32Array(t*2),r=new Uint32Array(e),o=0,l=0;for(let h of a){let d=h.attributes.position,u=h.attributes.normal,f=h.attributes.uv;if(i.set(d.array.subarray(0,d.count*3),o*3),u&&n.set(u.array.subarray(0,u.count*3),o*3),f&&s.set(f.array.subarray(0,f.count*2),o*2),h.index)for(let g=0;g<h.index.count;g++)r[l++]=h.index.array[g]+o;else for(let g=0;g<d.count;g++)r[l++]=g+o;o+=d.count}let c=new ke;return c.setAttribute("position",new de(i,3)),c.setAttribute("normal",new de(n,3)),c.setAttribute("uv",new de(s,2)),c.setIndex(new de(r,1)),c.computeBoundingSphere(),c}function Pa(a){a.updateMatrixWorld(!0);let t=new Map;a.traverse(i=>{if(!i.isMesh)return;let n=i.geometry.clone();n.applyMatrix4(i.matrixWorld);for(let s of Object.keys(n.attributes))["position","normal","uv"].includes(s)||n.deleteAttribute(s);n.attributes.uv||n.setAttribute("uv",new de(new Float32Array(n.attributes.position.count*2),2)),t.has(i.material)||t.set(i.material,[]),t.get(i.material).push(n)});let e=new Kt;for(let[i,n]of t){let s=new At(Qg(n),i);s.castShadow=!0,s.receiveShadow=!0,s.userData.texName=i.userData.texName||null,e.add(s)}return e}function _d(){let a=new Li({color:10255312,emissive:8019880,emissiveIntensity:2.4,transparent:!0,opacity:.42,roughness:.5,metalness:0,depthWrite:!1,side:_e}),t=new Kt,e=[[.13,.5,.13,0,1.55,0],[.1,.22,.1,0,1.92,0],[0,0,0,0,0,0]],i=new At(rt(.12,.18,.75,10,.8),a);i.position.y=1.3,t.add(i);let n=new At(Je(.115,12,.8),a);n.position.y=1.78,t.add(n);for(let r of[-1,1]){let o=new At(rt(.038,.038,.62,8,.8),a);o.position.set(r*.2,1.36,0),o.rotation.z=r*.14,t.add(o);let l=new At(rt(.05,.042,.7,8,.8),a);l.position.set(r*.08,.55,0),t.add(l)}for(let r=0;r<7;r++){let o=new At(rt(.006,.006,.5+r*.12,4,.8),a),l=r/7*Math.PI*2;o.position.set(Math.cos(l)*.45,1.2+Math.sin(r)*.2,Math.sin(l)*.45),o.rotation.z=Math.cos(l)*.5,o.rotation.x=Math.sin(l)*.5,t.add(o)}let s=new Ke(9398992,6,12,2);return s.position.set(0,1.4,0),t.add(s),t.userData.isSignal=!0,t.userData.light=s,t.userData.mat=a,t}function wd(a={}){let t=new Pt(a.seed||7),e=!!a.female,i=Kg(a.skin||(e?13214084:12095600)),n=en(a.coat||7035978,"fabric"),s=en(a.pants||4015696,"denim"),r=en(3813158,"leather"),o=en(a.hair||2827810,"fabric"),l=vt("steel",{color:5527644}),c=vt("wood",{color:6965808,repeat:[1,1]}),h=ye(1710101,{roughness:.45}),d=a.scale||(e?.94:1),u=1.76*d,f=new Kt;f.name="survivor";let g=new Kt,y=new Kt,p=u*.5,m=u*.26,x=(e?.36:.44)*d,v=.21*d,b=p+u*.1+m+u*.12,_=(it,ct,Wt,Jt,j,nt)=>{let ut=new At(it,ct);return ut.position.set(Wt,Jt,j),nt&&ut.rotation.set(nt[0]||0,nt[1]||0,nt[2]||0),g.add(ut),ut};_(ie.box(x*.92,u*.1,v*.95),s,0,p+u*.03,0),_(ie.torso(x,m,v),n,0,p+u*.1+m/2,0),_(ie.box(x*.68,u*.03,v*1.04),n,0,p+u*.1+m,0);for(let it of[-1,1])_(ie.head(.075*d),n,it*x*.46,p+u*.1+m*.9,0).scale.set(1.05,.8,1);_(ie.box(x*.95,.055,v*1.02),r,0,p+u*.085,0);for(let it of[-1,1])_(ie.box(.075*d,.09*d,.05*d),r,it*.15*d,p+u*.06,v*.5),_(ie.box(.055*d,m*.86,.02),r,it*.1*d,p+u*.1+m*.55,v*.52,[-.05,0,0]);_(ie.limb(.052*d,u*.055),i,0,p+u*.1+m+u*.025,0),_(ie.head(.108*d),i,0,b,0).scale.set(.9,1.06,.96),_(ie.head(.052*d),i,0,b-.078*d,.02*d).scale.set(.95,.72,.9);for(let it of[-1,1])_(ie.head(.028*d),i,it*.055*d,b-.008*d,.062*d).scale.set(.85,.6,.7);_(ie.cone(.015*d,.034*d),i,0,b-.014*d,.092*d,[Math.PI/2,0,0]);for(let it of[-1,1])_(Je(.018*d,8,.4),i,it*.034*d,b+.012*d,.0875*d).scale.set(1,.78,.45),_(Je(.0105*d,8,.35),h,it*.034*d,b+.011*d,.0935*d),_(ie.box(.044*d,.009*d,.012*d),o,it*.036*d,b+.037*d,.09*d,[0,0,it*-.14]);_(ie.box(.048*d,.007*d,.008*d),ye(7029816,{roughness:.9}),0,b-.05*d,.092*d);for(let it of[-1,1])_(ie.head(.026*d),i,it*.095*d,b-.006*d,.004*d).scale.set(.5,1,.7);if(!a.hat&&a.hairStyle!=="bald"?(_(ie.head(.121*d),o,0,b+.028*d,-.026*d).scale.set(.94,.92,.96),_(ie.box(.15*d,.024*d,.02*d),o,0,b+.066*d,.072*d,[.3,0,0]),(a.hairStyle==="braid"||e&&t.chance(.55))&&(_(rt(.03*d,.022*d,.34*d,6,.7),o,0,b-.14*d,-.1*d,[.22,0,0]),_(Je(.032*d,6,.6),o,0,b-.31*d,-.135*d))):a.hat&&_(ie.head(.114*d),o,0,b+.008*d,-.048*d).scale.set(.95,.92,.9),a.hat==="beanie"){let it=en(a.hatColor||4932152);_(ie.head(.126*d),it,0,b+.026*d,-.03*d).scale.set(1,.98,1.02),_(rt(.126*d,.127*d,.03*d,12,.7),it,0,b-.004*d,-.047*d)}else if(a.hat==="cap"){let it=en(a.hatColor||4212794);_(ie.head(.124*d),it,0,b+.04*d,-.03*d).scale.set(1,.86,1.02),_(ie.box(.15*d,.011*d,.085*d),r,0,b+.055*d,.08*d,[-.16,0,0])}if(a.scarf){let it=en(a.scarfColor||8011572);_(ie.box(.3*d,.09*d,.24*d),it,0,p+u*.1+m-.01,0),_(ie.box(.09*d,.3*d,.02*d),it,.06*d,p+u*.1+m-.17,.1*d,[.1,0,0])}if(a.pack){_(ie.box(.28*d,.36*d,.16*d),en(a.packColor||5130812),0,p+u*.22,-.18*d);let it=_(ie.limb(.055*d,.3*d),en(7168848),0,p+u*.4,-.19*d);it.rotation.z=Math.PI/2}a.rifle&&(_(ie.box(.06,.5,.16),c,.16*d,p+u*.24,-.26*d,[0,0,.34]),_(ie.limb(.016,.5),l,.02,p+u*.5,-.3*d,[0,0,.34])),_(ie.box(.01,m*.8,.008),ye(4867904,{roughness:.55,metalness:.35}),0,p+u*.1+m*.5,v*.52);let k=Pa(g);for(let it of k.children)it.castShadow=!0,it.receiveShadow=!0;y.add(k);let D=.052*d,w=u*.3,M=it=>{let ct=new Kt;ct.position.set(it*(x*.5+.035),p+u*.1+m*.9,0),ct.rotation.z=it*-.055;let Wt=new Kt,Jt=new At(ie.limb(D,w*.52),n);Jt.position.y=-w*.26,Wt.add(Jt);let j=new At(ie.limb(D*.88,w*.46),n);j.position.y=-w*.72,Wt.add(j);let nt=new At(ie.limb(D*.9,.03),r);nt.position.y=-w*.95,Wt.add(nt);let ut=Pa(Wt);ut.children.forEach(Nt=>{Nt.castShadow=!0,Nt.receiveShadow=!0}),ut.position.y=-w*.94,ut.children.forEach(Nt=>{Nt.geometry.translate(0,w*.94,0)}),ct.add(ut);let ft=new At(ie.head(D*.98),i);return ft.position.y=-w*.99,ft.scale.set(1,1.25,.7),ft.castShadow=!0,ct.add(ft),y.add(ct),ct},L=M(-1),U=M(1),H=u*.47,Y=it=>{let ct=new Kt;ct.position.set(it*x*.24,p+u*.02,0);let Wt=new Kt,Jt=new At(ie.limb(.072*d,H*.52),s);Jt.position.y=-H*.26,Wt.add(Jt);let j=new At(ie.limb(.06*d,H*.5),s);j.position.y=-H*.74,Wt.add(j);let nt=Pa(Wt);nt.children.forEach(ft=>{ft.castShadow=!0,ft.receiveShadow=!0,ft.geometry.translate(0,0,0)}),ct.add(nt);let ut=new At(ie.box(.1*d,.11*d,.24*d),r);return ut.position.set(0,-H*1+.02,.045*d),ut.castShadow=!0,ct.add(ut),y.add(ct),ct},B=Y(-1),et=Y(1);f.add(y),f.updateMatrixWorld(!0);let q=new Mi().setFromObject(f);y.position.y=-q.min.y;let ht={torso:y,armL:L,armR:U,legL:B,legR:et};return f.userData.height=u,{root:f,bones:ht,materials:{skin:i,coat:n,pants:s,boots:r,hair:o},height:u,phase:t.range(0,6.28)}}function t1(a){let t=Pa(a.root),e=new Mi().setFromObject(a.root);return t.position.copy(a.root.position),t.rotation.copy(a.root.rotation),t.children.forEach(i=>{i.castShadow=!0,i.receiveShadow=!0}),t.userData.height=a.height,{root:t,height:a.height,box:e}}var Ia={nika:{name:"Nika Volkova",role:"Hollow Street Camp",poi:"sub_camp",off:[3.4,2.6],look:{female:!0,coat:6967616,pants:3686988,skin:13214084,hair:3811872,scarf:!0,scarfColor:8011572,seed:11},tags:["camp","trader"],shop:{buy:["ammo_9mm","ammo_12g","bandage","water_bottle","crackers","jerky","cloth","battery","duct_tape","fuel","painkillers"],sellMul:.42,buyMul:1.35},nodes:{start:{text:a=>a.quests.isDone("m10")?"You came back from the church. Nobody comes back from the church. Sit down before you fall down.":a.quests.isActive("m09")?"The choir is still singing. I can hear it from here, and I am not going closer.":a.quests.canStart("m07")?"You are new. That means you still have all your fingers. Good. We need someone with fingers.":"Camp is quiet. Quiet is how I like it, and quiet never lasts.",choices:[{t:"Who are you?",next:"who"},{t:"What happened here?",next:"what"},{t:"I need work.",action:"quest"},{t:"Let me see your stock.",action:"shop"},{t:"Rest by the fire.",action:"rest"},{t:"Nothing. Stay alive.",action:"close"}]},who:{text:"Nika. I ran the depot on Volkhov Street before it was a depot of nothing. Now I keep eleven people breathing and I count the days by how many of them are still doing it.",choices:[{t:"Why stay here?",next:"why"},{t:"Back.",next:"start"}]},why:{text:"Because the alternative is walking. I have walked. Walking is just dying with extra steps and better scenery.",choices:[{t:"Back.",next:"start"}]},what:{text:"Six years ago the sky made a sound like a door closing. Then the wardens came through with green badges and told us to stay indoors. Then they stopped coming. Then the Hollow started singing.",choices:[{t:"The Hollow?",next:"hollow"},{t:"Back.",next:"start"}]},hollow:{text:"People. Or they were. Something took their faces and gave them a choir. They hunt sound \u2014 a footstep, a cough, a radio. Keep moving and keep quiet. If you have to shoot, shoot once.",choices:[{t:"And the signal?",next:"signal"},{t:"Back.",next:"start"}]},signal:{text:"Every radio in this district wakes up at the same time and plays a voice. Sometimes it is a woman reading numbers. Sometimes it is someone asking for help. Last week it was my husband. My husband has been dead for four years.",choices:[{t:"Back.",next:"start"}]}}},anders:{name:"Doctor Emil Anders",role:"Blackwood Research Post",poi:"for_outpost",off:[2.4,-2],look:{coat:5922904,pants:4078132,skin:12098176,hair:10130828,pack:!0,seed:23},tags:["camp","science"],nodes:{start:{text:a=>a.quests.isDone("m15")?"The tapes are decoded. It is a woman counting down from fourteen point seven. She has been counting down for six years and she has not reached zero.":a.quests.isActive("m13")?"The reels are in the adit. Bring them back before the web does. Whatever those tapes are, they are still warm.":a.quests.canStart("m12")?"Do not stand in the doorway. The light attracts them and I have exactly one doorway left.":"I am recording. If you have something worth saying, say it into the microphone. Otherwise, mind the instruments.",choices:[{t:"What are you doing out here?",next:"work"},{t:"The signal. What is it?",next:"sig"},{t:"Do you have supplies?",action:"shop"},{t:"Anything useful for me?",action:"quest"},{t:"Leave him to it.",action:"close"}]},work:{text:"Four years in this post, measuring a sound. I have the largest collection of magnetic tape in the world, and every reel says the same thing in a different woman's voice.",choices:[{t:"Why women?",next:"women"},{t:"Back.",next:"start"}]},women:{text:"Because the broadcast reuses what it has. The people it swallowed. I am not sentimental about it. I am careful about it.",choices:[{t:"Back.",next:"start"}]},sig:{text:"14.7 kilohertz. Constant carrier, buried under speech. It is not a recording \u2014 it responds. Ask it a question and wait nine seconds, and then it answers in a voice that has never heard your question.",choices:[{t:"What does it want?",next:"want"},{t:"Back.",next:"start"}]},want:{text:"That is the question I intend to answer before I die. My working hypothesis is that it wants listeners. It is a mouth with no throat and it has been talking into a world that stopped listening.",choices:[{t:"Back.",next:"start"}]}}},yelena:{name:"Yelena Marsh",role:"St. Agnes General Hospital",poi:"city_hospital",off:[-2.8,2.2],look:{female:!0,coat:9210490,pants:4081232,skin:12093290,hair:1972759,hat:"beanie",hatColor:4932152,seed:31},tags:["camp","medic"],shop:{buy:["bandage","medkit","painkillers","antibiotics","antirad","splint","stim_combat","water_purified"],sellMul:.45,buyMul:1.5},nodes:{start:{text:a=>a.quests.isDone("m25")?"The generators are running on fumes and the tunnels are quiet. I have not had a quiet night in three weeks.":a.quests.isActive("m24")?"Sixth floor. Fuel, then the breaker. Do not take the elevator \u2014 the third floor is where it stops.":"You are bleeding on my floor. That is fine. Everyone bleeds on my floor. Sit.",choices:[{t:"Why keep the lights on?",next:"lights"},{t:"Tell me about the city.",next:"city"},{t:"Treat me. (Costs 40 scrap)",action:"heal"},{t:"I can help.",action:"quest"},{t:"How do I get past the wall?",next:"wall"},{t:"Leave.",action:"close"}]},lights:{text:"Because on the night the wardens left, they turned the hospital lights off and everyone in the quarantine wing died in the dark. I was fourteen. I have kept them on since.",choices:[{t:"Back.",next:"start"}]},city:{text:"Kirov is a machine that eats people and leaves their apartments tidy. The silence is worse than the mutants. At least the mutants are honest about wanting to kill you.",choices:[{t:"Back.",next:"start"}]},wall:{text:"Metro Line 2 runs under the exclusion wall. The stairs behind the hospital go down. Something has been digging in the tunnels for years, so bring a light and a gun and a reason.",choices:[{t:"Back.",next:"start"}]}}},kravchuk:{name:"Sergeant Anton Kravchuk",role:"Forward Post Delta",poi:"mil_camp",off:[2.6,2.2],look:{coat:5002050,pants:3817528,skin:11043690,hair:7038304,hat:"cap",hatColor:3949622,rifle:!0,pack:!0,seed:41},tags:["camp","military"],shop:{buy:["ammo_9mm","ammo_762","ammo_12g","ammo_38","kevlar_vest","filter","gasmask","stim_combat","gunpowder"],sellMul:.4,buyMul:1.45},nodes:{start:{text:a=>a.quests.isDone("m30")?"The commander is dead. I have no orders. Four years of orders, and now I have a rifle and a chair and the sound of wind. Do you know what that is like?":a.quests.isActive("m29")?"The lab is below us. K-9. My men went down there in green badges and came back speaking in a language with too many vowels.":a.quests.canStart("m27")?"State your business at the post. Slowly. Hands where the light is.":"Perimeter is quiet. Patrol is overdue. Do not touch the wire.",choices:[{t:"Who still gives you orders?",next:"orders"},{t:"What is the exclusion zone?",next:"zone"},{t:"I need ammunition.",action:"shop"},{t:"I have questions about the lab.",action:"quest"},{t:"Dismissed.",action:"close"}]},orders:{text:"The Commander. Pale Commander, we called him, because he never went outside. Written orders came twice a month, every month, for two years after the evacuation was cancelled. Then they came weekly. Then they came in his handwriting, and then they came in something that used his handwriting.",choices:[{t:"What did the last order say?",next:"last"},{t:"Back.",next:"start"}]},last:{text:"CONTINUE BROADCAST. DO NOT ANSWER THEM. I have it in my pocket. I have read it four hundred times and I still do not know which of those is the warning.",choices:[{t:"Back.",next:"start"}]},zone:{text:"Sixty kilometres of wire and bunkers, built to keep something in. Every gun on every tower points at us. They spent a fortune making sure we could never look over the wall, and then they left the door open.",choices:[{t:"Back.",next:"start"}]}}},mother_ash:{name:"Mother Ash",role:"Ash Nomads",poi:"was_camp",off:[3,1.8],look:{female:!0,coat:8018498,pants:5916214,skin:9401432,hair:9077880,hairStyle:"braid",scarf:!0,scarfColor:9071162,seed:53},tags:["camp","nomad"],nodes:{start:{text:a=>a.quests.isDone("m35")?"The Titan is down and the ash falls the right way again. You have done a thing the red ground will remember longer than it remembers us.":a.quests.isActive("m32")?"Shards, child. Three of them. The lake likes to be paid and I am too old to argue with water.":"You are walking on my grandmother. Everyone walks on someone out here. Sit and I will tell you what the ground has been saying.",choices:[{t:"What is this place?",next:"place"},{t:"How do you survive out here?",next:"survive"},{t:"What do you need?",action:"quest"},{t:"Rest in the tent.",action:"rest"},{t:"Walk on.",action:"close"}]},place:{text:"Before the sky broke, this was a station where people counted something invisible. Now we count the ones who walk out of the crater and do not come back. We call them the Contaminated. We call ourselves the lucky.",choices:[{t:"The crater?",next:"crater"},{t:"Back.",next:"start"}]},crater:{text:"It was a cooling tower. The tower is still there. It stands up at the rim and the air bends around it. Some nights it walks. I have seen the ground shake where it stepped and I am not a woman who lies about the ground.",choices:[{t:"Back.",next:"start"}]},survive:{text:"We eat what grows in ash, and we do not eat what grows in the lake. We sleep in the day. We do not go to the array \u2014 the array is not ours, and the voice that lives in it has never once said a true thing.",choices:[{t:"Back.",next:"start"}]}}},signal:{name:"The Signal",role:"???",poi:"was_array",off:[0,3],look:{ghost:!0,seed:67},tags:["story"],nodes:{start:{text:"Fourteen point seven. Fourteen point seven. You are standing in the mouth of it now, so we can speak without the radio.",choices:[{t:"What are you?",next:"what"},{t:"Where is my brother?",next:"brother"},{t:"Why did you call me?",next:"why"},{t:"I am here to end this.",next:"end"}]},what:{text:"I am what is left of a recording. A man spoke my first sentence into a microphone in a room under a mountain, and the room had been built to keep the sentence alive. He is dead. My sentence is not.",choices:[{t:"That is not an answer.",next:"notans"},{t:"Back.",next:"start"}]},notans:{text:"No. It is the only answer I have that is entirely true. Everything else I could tell you would be a voice I am wearing.",choices:[{t:"Where is my brother?",next:"brother"}]},brother:{text:"Mikhail Vostrikov. Signal technician, Shelter Twelve, badge 4471. He came here to switch me off. He could not. He asked me to keep talking to you, and he wrote it down, and I have been reading his handwriting ever since.",choices:[{t:"Read it to me.",next:"letter"},{t:"Back.",next:"start"}]},letter:{text:'"If you are hearing this, you are colder than I was. Do not trust the voice. Do not trust the wardens. Trust the lights in the hospital. \u2014 M."',choices:[{t:"That is his handwriting.",next:"end"}]},why:{text:"Because a signal with no listener is just noise. I have been noise for six years. You are the first thing that walked toward me instead of away.",choices:[{t:"Then stop transmitting.",next:"end"}]},end:{text:"Yes. That is what he said, too. There is a console behind me. It will ask for a core and it will ask for a hand, and it will not tell you which one it wants more.",choices:[{t:"Do it.",action:"finale"},{t:"Not yet.",action:"close"}]}}}},_c=class{constructor(t,e){this.game=t,this.npc=e,this.stock={};for(let i of e.shop.buy){let n=this.game.itemDef(i),s=n?.value||10;this.stock[i]={qty:Math.max(1,Math.round((n?.stack||4)*.6)),price:Math.round(s*e.shop.buyMul)}}this.restockTimer=0}priceOf(t){let e=this.game.itemDef(t);return Math.round((e?.value||10)*this.npc.shop.buyMul)}sellPrice(t){return Math.round((this.game.itemDef(t)?.value||5)*this.npc.shop.sellMul)}buy(t,e=1){let i=this.stock[t],n=this.game.inventory;if(!i||i.qty<e)return this.game.notify("They do not have that many."),!1;let s=this.priceOf(t)*e;return n.gold<s?(this.game.notify("Not enough trade goods. You have "+n.gold+"."),!1):n.add(t,e)<e?(this.game.notify("No room in the pack."),!1):(n.gold-=s,i.qty-=e,this.game.audio.trade(),this.game.ui.refreshShop?.(),!0)}sell(t){let e=this.game.inventory.items.find(n=>n.uid===t);if(!e)return!1;let i=this.sellPrice(e.id)*e.qty;return this.game.inventory.removeUid(t),this.game.inventory.gold+=i,this.game.audio.trade(),this.game.ui.refreshShop?.(),!0}update(t){if(this.restockTimer+=t,this.restockTimer>240){this.restockTimer=0;for(let[e,i]of Object.entries(this.stock)){let n=this.game.itemDef(e);i.qty=Math.min(i.qty+Math.ceil((n?.stack||4)*.4),Math.round((n?.stack||4)*.8))}}}},La=class{constructor(t){this.game=t,this.list=[],this.ambient=[],this.spawned=!1,this.dialogue=null,this.nearest=null,this.shop=null,this.barkTimer=0,this.finaleArmed=!1}poi(t){return this.game.world.pois.find(e=>e.id===t)}freeSpot(t,e,i=.55){let n=this.game.world,s=(r,o)=>{let l=n.heightAt(r,o),c=n.colliders.query(r-i,o-i,r+i,o+i);for(let h of c)if(!(h.maxY!==void 0&&h.maxY<l+.4)&&!(h.tag==="floor"||h.tag==="road")&&r+i>h.minX&&r-i<h.maxX&&o+i>h.minZ&&o-i<h.maxZ)return!1;return!0};if(s(t,e))return{x:t,z:e,y:n.heightAt(t,e)};for(let r=.8;r<=7;r+=.8)for(let o=0;o<Math.PI*2;o+=.5){let l=t+Math.cos(o)*r,c=e+Math.sin(o)*r;if(s(l,c))return{x:l,z:c,y:n.heightAt(l,c)}}return{x:t,z:e,y:n.heightAt(t,e)}}spawn(){let t=this.game.scene;for(let[e,i]of Object.entries(Ia)){let n=this.poi(i.poi);if(!n){console.warn("NPC poi missing",i.poi);continue}let s=n.x+i.off[0],r=n.z+i.off[1];if(i.look.ghost){this.list.push({id:e,def:i,x:s,z:r,y:n.y,ghost:!0});continue}let o=this.freeSpot(s,r,.6);s=o.x,r=o.z;let l=wd(i.look);l.root.position.set(s,o.y,r),l.root.rotation.y=Math.atan2(this.game.world.startPosition[0]-s,this.game.world.startPosition[2]-r),t.add(l.root);let c={id:e,def:i,body:l,x:s,z:r,y:o.y,ry:l.root.rotation.y,home:{x:s,z:r},homeY:o.y,shop:i.shop?new _c(this.game,i):null,anim:Math.random()*10,talkCooldown:0,greeted:!1};this.list.push(c)}this.spawnAmbient(),this.spawned=!0}spawnAmbient(){let t=[...this.game.lite?[["sub_camp",2],["city_camp",1],["mil_camp",1],["was_camp",1]]:[["sub_camp",5],["city_camp",4],["mil_camp",3],["was_camp",4],["ind_camp",3],["for_outpost",2],["for_camp",3]]],e=new Pt(9182),i=[{coat:6248008,pants:3817800},{coat:6969930,pants:4603962},{coat:5134924,pants:3422784},{coat:5917244,pants:4081232},{coat:6971986,pants:3093560},{coat:8018500,pants:4867128}];for(let[n,s]of t){let r=this.poi(n);if(r)for(let o=0;o<s;o++){let l=e.range(0,Math.PI*2),c=e.range(3.5,10),h=this.freeSpot(r.x+Math.cos(l)*c,r.z+Math.sin(l)*c,.5),d=i[e.int(0,i.length-1)],u=e.chance(.5),f=wd({female:u,coat:d.coat,pants:d.pants,seed:e.int(1,9999),skin:u?13214084:12095600,hat:e.chance(.4)?"beanie":null,hair:[2827810,4864554,7038304,9077880][e.int(0,3)]}),g=e.int(0,2);g===0?(f.bones.legL.rotation.x=-1.2,f.bones.legR.rotation.x=-1.2,f.root.position.y=h.y-f.height*.28,f.bones.torso.rotation.x=.12):g===1?(f.bones.torso.rotation.x=.45,f.bones.armR.rotation.x=-.9,f.bones.armL.rotation.x=-.4,f.root.position.y=h.y-f.height*.06):(f.bones.armL.rotation.x=-.5,f.bones.armR.rotation.x=.25),f.root.position.x=h.x,f.root.position.z=h.z,f.root.rotation.y=e.range(0,Math.PI*2);let y=t1(f);this.game.scene.add(y.root),this.ambient.push({body:y,x:h.x,y:y.root.position.y,z:h.z,anim:e.range(0,9)})}}}open(t){!t||t.ghost||(this.dialogue={npc:t,nodeId:"start",node:null,open:!0},this.game.audio.uiClick(),this.game.ui.openDialogue(t.def.name,t.def.role),this.enter("start"))}enter(t){let e=this.dialogue;if(!e)return;let i=e.npc.def,n=i.nodes[t];if(!n){this.close();return}e.nodeId=t;let s=typeof n.text=="function"?n.text(this.game):n.text,o=((typeof n.choices=="function"?n.choices(this.game):n.choices)||[]).map(l=>({text:l.t,action:l.action||null,next:l.next||null}));e.node={text:s,choices:o},this.game.ui.showDialogue({speaker:i.name,role:i.role,text:s,choices:o}),this.game.audio.uiClick()}choose(t){let e=this.dialogue;if(!e||!e.node)return;let i=e.node.choices[t];if(!i)return;if(this.game.audio.uiClick(),i.next){this.enter(i.next);return}let n=i.action;if(!n||n==="close"){this.close();return}let[s,r]=n.split(":");if(n==="quest")return this.handleQuest(e.npc);if(n==="shop")return this.openShop(e.npc);if(n==="rest")return this.rest(e.npc);if(n==="heal")return this.heal(e.npc);if(n==="finale")return this.triggerFinale();if(n==="save"){this.game.saveGame(!0),this.game.notify("Journal updated.");return}}handleQuest(t){let e=this.game.quests,i=e1[t.id]||[],n=i.find(r=>e.canStart(r)),s=i.find(r=>e.isActive(r));if(n){e.start(n);let r=e.def(n);this.showLine(t,r.desc+`

\u2014 Objective: `+r.objectives.map(o=>o.desc).join(" "));return}if(s){let o=e.def(s).objectives.map((l,c)=>(e.state[s].progress[c]>=(l.count||1)?"[x] ":"[ ] ")+(l.desc||l.type)).join(`
`);this.showLine(t,`You are already on it.

`+o);return}this.showLine(t,"Nothing right now. Come back when the wind changes.")}showLine(t,e){this.dialogue.node={text:e,choices:[{text:"Understood.",action:"close"}]},this.game.ui.showDialogue({speaker:t.def.name,role:t.def.role,text:e,choices:this.dialogue.node.choices})}openShop(t){t.shop&&(this.dialogue.open=!1,this.game.ui.openShop(t,t.shop),this.game.audio.uiClick())}rest(t){this.close(),this.game.restAtCamp(t)}heal(t){let e=this.game.inventory;if(e.gold<40){this.showLine(t,"Forty in trade goods. I do not work for promises.");return}e.gold-=40,this.game.player.heal(70),this.game.player.stats.bleed=0,this.game.player.stats.infection=Math.max(0,this.game.player.stats.infection-40),this.game.audio.heal?.(),this.game.notify("Patched up. -40 trade goods."),this.showLine(t,"That will hold. Keep it dry. Do not do whatever you did again.")}heroNodeFor(t,e){for(let i of e)if(this.NODES[t]?.[i])return i;return"start"}triggerFinale(){this.close(),this.game.startFinale()}close(){this.dialogue=null,this.game.ui.closeDialogue()}update(t){if(!this.spawned)return;let e=this.game.player,i=e.position.x,n=e.position.z,s=e.position.y,r=null,o=4.2;for(let c of this.list){if(c.ghost)continue;let h=Math.hypot(c.x-i,c.z-n);if(h<7){c.ry=Nn(c.ry,Math.atan2(i-c.x,n-c.z),2.2,t),c.body.root.rotation.y=c.ry,c.anim+=t;let d=Math.sin(c.anim*1.4)*.012;c.body.bones.torso.position.y=d,c.body.bones.torso.rotation.z=Math.sin(c.anim*.5)*.012,c.body.bones.armL.rotation.x=Math.sin(c.anim*.7+.4)*.06-.04,c.body.bones.armR.rotation.x=Math.sin(c.anim*.66)*.06-.04;let u=Math.atan2(i-c.x,n-c.z)-c.ry;c.body.bones.torso.rotation.y=Z(Math.sin(u)*.12,-.14,.14)*(Math.abs(u)<1.5?1:0),h<6&&!c.greeted&&(c.greeted=!0,c.talkCooldown=20,this.game.ui.notify(c.def.name,this.greeting(c),"#c8b48c"))}else c.anim+=t,c.body.bones.torso.position.y=Math.sin(c.anim*.9)*.008,c.body.bones.torso.rotation.y*=.96;c.talkCooldown>0?c.talkCooldown-=t:c.greeted=c.greeted,h<o&&Math.abs(c.y-s)<3.2&&(r=c,o=h)}for(let c of this.ambient)c.anim+=t,c.body.bones?.torso?(c.body.bones.torso.rotation.z=Math.sin(c.anim*.6+c.x)*.014,c.body.bones.torso.position.y=Math.sin(c.anim*.8+c.z)*.007):c.body.root&&(c.body.root.rotation.z=Math.sin(c.anim*.6+c.x)*.006);let l=r!==this.nearest;this.nearest=r,l?r?this.game.ui.setPrompt("[E]  Talk to "+r.def.name):this.game.ui.setPrompt(null):r&&!this.game.ui.promptVisible?.()&&this.game.ui.setPrompt("[E]  Talk to "+r.def.name),!r&&this.game.ui.promptVisible?.()&&this.game.ui.setPrompt(null);for(let c of this.list)c.shop&&c.shop.update(t)}greeting(t){let e=this.game,n={nika:["You are standing in my light.","New face. Old coat. That tracks.","Do not touch the water barrel."],anders:["Mind the cables. Please.","You are breathing too loudly for the forest.","The instruments are recording you. Do not be alarmed."],yelena:["You look like you have not slept. Sit.","Wash your hands if you are coming in.","The generator is holding. Barely."],kravchuk:["Stop there. Identify.","Post is active. State your business.","You are not on the roster. You are lucky I am tired."],mother_ash:["The ground remembers you. Sit.","You carry ash in your coat. Good.","The lake is quiet tonight. That is not a kindness."]}[t.id]||["..."];return n[Math.floor(Math.random()*n.length)]}interact(){return this.nearest?(this.open(this.nearest),!0):!1}signalNode(){return Ia.signal.nodes.start}serialize(){return{greeted:this.list.map(t=>t.greeted)}}deserialize(t){t?.greeted&&this.list.forEach((e,i)=>{t.greeted[i]&&(e.greeted=!0)})}},e1={nika:["m06","m07","m08","s02"],anders:["m12","m13","m14","s08"],yelena:["m23","m24","m25","s17","s18"],kravchuk:["m27","m28","m29","s26","s27","s30"],mother_ash:["m32","m33","m34","s32"]};var ws=["head","torso","armL","armR","legL","legR"],Mc={head:"Head",torso:"Torso",armL:"Left Arm",armR:"Right Arm",legL:"Left Leg",legR:"Right Leg"},i1=(a,t)=>a?a==="arms"?t()<.5?"armL":"armR":a==="legs"?t()<.5?"legL":"legR":ws.includes(a)?a:"torso":"torso",Da=class{constructor(t){this.game=t,this.reset()}reset(){this.condition={head:100,torso:100,armL:100,armR:100,legL:100,legR:100},this.wounds={head:{bleed:0,fracture:!1,infection:0},torso:{bleed:0,fracture:!1,infection:0},armL:{bleed:0,fracture:!1,infection:0},armR:{bleed:0,fracture:!1,infection:0},legL:{bleed:0,fracture:!1,infection:0},legR:{bleed:0,fracture:!1,infection:0}},this.visionBlur=0,this.limp=0}partCondition(t){return this.condition[t]??100}incoming(t,e){let i=i1(e,Math.random),n=this.condition[i],s=i==="head"?1.35:i==="torso"?1:.85;return n<25&&(s*=1.2),{part:i,amount:t*s}}hit(t,e,i={}){!this.condition[t]&&this.condition[t]!==0&&(t="torso");let n=this.wounds[t];this.condition[t]=Z(this.condition[t]-e*.95,0,100),e>5&&(n.bleed=Z(n.bleed+e*.22,0,100)),i.bleed&&(n.bleed=Z(n.bleed+i.bleed*.5,0,100)),i.infection&&(n.infection=Z(n.infection+i.infection*.6,0,100)),(i.fracture&&(t.startsWith("leg")||t.startsWith("arm"))&&this.condition[t]<65||i.fracture&&e>22&&this.condition[t]<40)&&(n.fracture=!0),n.bleed>45&&Math.random()<.18&&(n.infection=Z(n.infection+3,0,100)),t==="head"&&this.condition.head<55&&(this.visionBlur=Math.max(this.visionBlur,.35)),this.syncPlayerBleed()}syncPlayerBleed(){let t=this.game.player;if(!t)return;let e=0,i=0;for(let n of ws)e+=this.wounds[n].bleed,i+=this.wounds[n].infection;t.stats.bleed=Z(e,0,100),t.stats.infection=Z(Math.max(t.stats.infection,i),0,100),t.stats.fractures={head:this.wounds.head.fracture,torso:this.wounds.torso.fracture,arms:this.wounds.armL.fracture||this.wounds.armR.fracture,legs:this.wounds.legL.fracture||this.wounds.legR.fracture}}moveMultiplier(){let t=Math.min(this.condition.legL,this.condition.legR),e=(this.wounds.legL.fracture?.55:0)+(this.wounds.legR.fracture?.55:0),i=t>70?1:Rt(.55,1,t/70);return i*=1-e*.5,Z(i,.35,1)}aimMultiplier(){let t=Math.min(this.condition.armL,this.condition.armR),e=t>60?1:Rt(1.9,1,t/60);return(this.wounds.armL.fracture||this.wounds.armR.fracture)&&(e*=1.35),e}staminaMultiplier(){let t=this.condition.torso;return t>60?1:Rt(.45,1,t/60)}isCrippled(){return this.condition.legL<20||this.condition.legR<20}update(t){let i=this.game.player;if(!i||i.dead)return;let s=1-((i.skills||{}).bleedResist||0),r=0;for(let o of ws){let l=this.wounds[o];if(l.bleed>0){let c=l.bleed*.016*s;i.stats.health=Z(i.stats.health-c*t,0,i.stats.healthMax),l.bleed=Math.max(0,l.bleed-t*.22),r+=l.bleed}l.infection>0&&(l.infection=Z(l.infection+t*.012,0,100),i.stats.health=Z(i.stats.health-l.infection*.0028*t,0,i.stats.healthMax),l.infection>60&&i.stats.stress<100&&(i.stats.stress=Z(i.stats.stress+t*.05,0,100))),i.stats.hunger>45&&i.stats.thirst>45&&l.bleed<2&&(this.condition[o]=Z(this.condition[o]+t*.35,0,100),this.condition[o]>70&&l.infection<5&&(l.infection=Math.max(0,l.infection-t*.12)),this.condition[o]>90&&(l.fracture=!1))}i.stats.bleed=Z(r,0,100),this.syncPlayerBleed(),this.visionBlur=Math.max(0,this.visionBlur-t*.12),i.stats.health<=0&&(i.dead=!0)}treat(t,e){let i=this.game,n=i.inventory,s=i.player;if(!(n.count(e)>0))return i.notify("No "+this.itemName(e)+" left."),!1;let o=1+(s.skills?.healing||0),l=()=>n.removeUid(n.items.find(h=>h.id===e).uid,1),c=this.wounds[t]||this.wounds.torso;if(e==="bandage"){if(c.bleed<1&&this.condition[t]>92)return i.notify("Nothing to bandage there."),!1;l(),c.bleed=Math.max(0,c.bleed-55),this.condition[t]=Z(this.condition[t]+9*o,0,100),this.syncPlayerBleed(),i.audio.heal?.(),i.notify("Bandage applied",Mc[t]+" bleeding reduced.",null,"good")}else if(e==="splint"){if(!c.fracture)return i.notify("No fracture to set there."),!1;l(),c.fracture=!1,this.condition[t]=Z(this.condition[t]+14,0,100),this.syncPlayerBleed(),i.audio.heal?.(),i.notify("Splint fitted",Mc[t]+" stabilised. It will still hurt.",null,"good")}else if(e==="medkit")l(),c.bleed=0,this.condition[t]=Z(this.condition[t]+58*o,0,100),s.heal(30*o),this.syncPlayerBleed(),i.audio.heal?.(),i.notify("Medkit used",Mc[t]+" repaired, bleeding stopped.",null,"good");else if(e==="antibiotics"){l();for(let h of ws)this.wounds[h].infection=Math.max(0,this.wounds[h].infection-80),this.condition[h]=Z(this.condition[h]+12,0,100);s.stats.infection=Math.max(0,s.stats.infection-80),this.syncPlayerBleed(),i.notify("Antibiotics taken","Infection receding.",null,"good")}else if(e==="antirad")l(),s.stats.radiation=Math.max(0,s.stats.radiation-70),i.notify("Anti-rad injected","Isotopes bound. Radiation -70.",null,"good");else if(e==="painkillers")l(),s.stats.stress=Math.max(0,s.stats.stress-30),s.heal(12),i.notify("Painkillers taken","Stress reduced.",null,"good");else if(e==="stim_combat"){if(s.stamina>92)return i.notify("You are already wired."),!1;l(),s.stamina=s.staminaMax,s.heal(25*o),s.stats.stress=Math.max(0,s.stats.stress-20);for(let h of ws)this.wounds[h].bleed=Math.max(0,this.wounds[h].bleed-18);this.syncPlayerBleed(),i.audio.heal?.(),i.notify("Combat stim","Stamina restored, bleeding slowed.",null,"good")}else return i.notify("That will not help here."),!1;return i.ui&&i.ui.hud.updateWeapon(),!0}itemName(t){let e=this.game.itemDef(t);return e?e.name:t}serialize(){return{condition:this.condition,wounds:this.wounds}}deserialize(t){if(t){if(t.condition&&Object.assign(this.condition,t.condition),t.wounds)for(let e of ws)Object.assign(this.wounds[e],t.wounds[e]||{});this.syncPlayerBleed()}}};var n1=new Set(["metal_paint","clothes","flesh_scrap"]),rr=class{constructor(t){this.game=t,this.rng=new Pt(20903),this.looted=new Set,this.spots=[],this.index=new Map,this.taken=new Set,this.containerMeshes=new Map,this.spawnMeshes(),this.timer=0}spawnMeshes(){let e=this.game.world.lootSpots||[];for(let i=0;i<e.length;i++){let n=e[i],s={id:i,x:n.x,y:n.y,z:n.z,table:n.table,kind:n.kind||"crate",looted:!1};this.spots.push(s);let r=Math.floor(n.x/8)+","+Math.floor(n.z/8);this.index.has(r)||this.index.set(r,[]),this.index.get(r).push(s)}}nearby(t,e=2.6){let i=[],n=Math.ceil(e/8)+1,s=Math.floor(t.x/8),r=Math.floor(t.z/8);for(let o=s-n;o<=s+n;o++)for(let l=r-n;l<=r+n;l++){let c=this.index.get(o+","+l);if(c)for(let h of c){if(h.looted)continue;let d=Math.hypot(h.x-t.x,h.z-t.z);d<e&&i.push({spot:h,dist:d})}}return i.sort((o,l)=>o.dist-l.dist),i}roll(t,e={}){let i=Ws[t]||Ws.house,n=[],s=e.rolls??1+(this.rng.chance(.35)?1:0);for(let r=0;r<s;r++){let o=i.reduce((g,y)=>g+y.w,0),l=this.rng.next()*o,c=i[0];for(let g of i)if(l-=g.w,l<=0){c=g;break}if(!c||n1.has(c.id))continue;let h=this.rng.int(c.min||1,c.max||c.min||1),d=qe[c.id],u=this.game.player?.skills?.lootBonus||0,f=Math.max(1,Math.round(h*(1+(u?this.rng.next()*u:0))));d&&d.cat==="quest"&&this.rng.chance(.4)||n.push({id:c.id,qty:f})}return n}open(t,e={}){if(t.looted)return[];t.looted=!0,this.taken.add(t.id);let i=this.roll(t.table,{rolls:t.kind==="locker"?3:t.kind==="corpse"?2:1}),n=this.game.inventory,s=[];for(let o of i){let l=n.add(o.id,o.qty);l>0?s.push({...o,qty:l}):this.game.dropLootBag(o.id,o.qty,t.x,t.y,t.z)}let r=s.map(o=>`${(qe[o.id]||Me[o.id])?.name||o.id} \xD7${o.qty}`);return r.length?(this.game.notify("Recovered",r.join(`
`),null,"good"),this.game.audio.pickup(),this.game.quests.onCollect()):this.game.notify("Empty","Somebody already took anything worth carrying."),t.mesh&&(t.mesh.visible=!1),s}enemyDrop(t){let e=Ti[t.type]||{},i=t.type==="brute"?"warden":e.regions?.includes("wasteland")?"mutant":t.type==="hollow"&&this.rng.chance(.25)?"warden":"mutant",n=this.roll(i,{rolls:t.isBoss?5:1}),s=this.game.inventory;for(let o of n)s.add(o.id,o.qty)===0&&this.game.dropLootBag(o.id,o.qty,t.pos.x,t.pos.y,t.pos.z);t.isBoss&&(s.add("artifact_shard",1),s.add("record_tape",1));let r=n.map(o=>`${qe[o.id]?.name||o.id} \xD7${o.qty}`);r.length&&this.game.notify("Salvaged from the body",r.join(`
`),null,"good"),this.game.quests.onCollect()}dropBag(t,e,i,n,s){this.game.dropLootBag(t,e,i,n,s)}update(t){let e=this.game;if(this.timer+=t,this.timer>1){this.timer=0;let i=this.nearby(e.player.pos,2.2);i.length&&!e.locked?(e.ui.setPrompt(`[E]  Search ${i[0].spot.kind==="locker"?"locker":i[0].spot.kind==="corpse"?"body":"container"}`),this.promptSpot=i[0].spot):this.promptSpot&&!e.npcs.nearest&&(this.promptSpot=null)}}peekTable(t){return(Ws[t]||Ws.house)[0]?.id}interact(){let t=this.nearby(this.game.player.pos,2.6);return t.length?(this.open(t[0].spot),!0):!1}serialize(){return{looted:[...this.taken]}}deserialize(t){if(t?.looted)for(let e of t.looted){let i=this.spots[e];i&&(i.looted=!0,this.taken.add(e))}}};var Sc=[{id:"supply_drop",name:"SUPPLY DROP",weight:3,minAct:1,announce:"A cargo parachute is drifting down. Warden colours. Something else saw it too.",run(a,t){let e=a.player.pos.x,i=a.player.pos.z;for(let n=0;n<20;n++){let s=t.range(0,Math.PI*2),r=t.range(26,46),o=e+Math.cos(s)*r,l=i+Math.sin(s)*r;if(a.world.heightAt(o,l)===null)continue;if(a.spawnSupplyCrate(o,l,"military")){a.setWaypoint(o,l);break}}for(let n=0;n<3;n++)a.spawnEnemyNear("hollow",30,40)}},{id:"swarm",name:"SWARM",weight:4,minAct:2,announce:"The ground is moving. Something upstream woke the nest.",run(a,t){let e=4+Math.floor(t.range(0,4));for(let i=0;i<e;i++)a.spawnEnemyNear(t.pick(["crawler","crawler","hollow"]),34,55);a.audio.enemyAlert("hollow",a.player.pos)}},{id:"rad_storm",name:"RADIATION STORM",weight:2,minAct:3,regions:["wasteland","industrial","military"],announce:"The air turns to static. Geiger counters sound like rain. Get under cover.",run(a){a.sky.setWeather("radstorm",!1),a.eventState.radStorm=110;for(let t of a.world.pois)t.type==="shelter"&&a.setWaypoint(t.x,t.z)},tick(a,t){let e=a.eventState;if(e.radStorm>0){if(e.radStorm-=t,!(a.world.environmentAt?a.world.environmentAt(a.player.pos.x,a.player.pos.z):null)?.indoor){let s=1-(a.player.armorRadRes||0)*1.1;a.player.stats.radiation=Z(a.player.stats.radiation+t*.55*s,0,100)}e.radStorm<=0&&(a.sky.setWeather("overcast",!1),a.notify("The storm passes","The static dies down. Your teeth stop buzzing.",null,"good"))}}},{id:"night_hunt",name:"NIGHT HUNT",weight:3,minAct:2,night:!0,announce:"Something is walking the ridge. It has stopped making noise on purpose.",run(a,t){a.spawnEnemyNear("pale",40,60);for(let e=0;e<2;e++)a.spawnEnemyNear("stalker",30,50);a.audio.paleHowl?.()}},{id:"signal_pulse",name:"SIGNAL PULSE",weight:2,minAct:3,announce:"Every radio in the district clicks on at once. A voice gives coordinates.",run(a){let t=a.world.pois[Math.floor(Math.random()*a.world.pois.length)];a.setWaypoint(t.x,t.z),a.spawnEnemyNear("watcher",40,55),a.spawnEnemyNear("watcher",45,60),a.notify("Coordinates",`${t.name.toUpperCase()} \u2014 ${Math.round(t.x)}, ${Math.round(t.z)}`,null,"quest")}},{id:"stray_trader",name:"STRAY TRADER",weight:2,minAct:1,announce:"A bell in the fog. Somebody is trading out here, which means somebody is desperate.",run(a,t){let e=a.player.pos.x,i=a.player.pos.z,n=t.range(0,Math.PI*2),s=t.range(18,28),r=a.spawnSupplyCrate(e+Math.cos(n)*s,i+Math.sin(n)*s,"store");r&&a.setWaypoint(r.x,r.z)}},{id:"howl",name:"DISTANT HOWL",weight:3,minAct:1,announce:"Something answers from the treeline. Then something closer answers it.",run(a,t){for(let e=0;e<2;e++)a.spawnEnemyNear(t.pick(["hollow","crawler"]),45,70);a.audio.enemyAlert("hollow",a.player.pos,1)}}],Na=class{constructor(t){this.game=t,this.rng=new Pt(2654435769),this.cooldown=95,this.active=[],this.state={},this.total=0}update(t){let e=this.game;for(let i of Sc)i.tick&&i.tick(e,t);e.locked||e.player.dead||(this.cooldown-=t,!(this.cooldown>0)&&(this.cooldown=this.rng.range(110,210),this.fire()))}eligible(){let t=this.game,e=t.act||1,i=t.world.regionAt(t.player.pos.x,t.player.pos.z)?.id,n=t.sky?.isNight;return Sc.filter(s=>!(s.minAct>e||s.regions&&!s.regions.includes(i)||s.night&&!n))}fire(t=null){let e=this.game,i=this.eligible();if(!i.length)return null;let n=t?Sc.find(s=>s.id===t):null;if(!n){let s=i.reduce((o,l)=>o+l.weight,0),r=this.rng.next()*s;n=i[0];for(let o of i)if(r-=o.weight,r<=0){n=o;break}}this.total++,e.audio.eventSting?.(),e.ui.notify(n.name,n.announce,"#c9963f","danger");try{n.run(e,this.rng)}catch(s){console.warn("event failed",n.id,s)}return this.active.push({id:n.id,t:0,life:150}),n}serialize(){return{cooldown:this.cooldown,total:this.total}}deserialize(t){t&&(this.cooldown=t.cooldown??95,this.total=t.total||0)}};var za=12,Oa=class{constructor(t){this.game=t,this.doors=[],this.grid=new Map,this.index=new Map,this.dirty=!0,this.build()}build(){let t=this.game.world.doorSpecs||[];if(!t.length)return;let e={wood:[],metal:[]};for(let o of t)e[o.kind==="metal"?"metal":"wood"].push(o);let i=C(1,2.1,.06,1);i.translate(.5,0,0);let n=r1(),s=Md(i,n,.86,0),r=Md(i,n,.88,0);this.meshes={};for(let o of["wood","metal"]){let l=e[o];if(!l.length)continue;let c=o==="wood"?s:r,h=o==="wood"?E.woodWeathered:E.metalPaint,d=new Fi(c,h,l.length);d.castShadow=!0,d.receiveShadow=!0,d.frustumCulled=!1,d.name="doors_"+o,this.game.scene.add(d),this.meshes[o]=d,l.forEach((u,f)=>this.addDoor(u,d,o,f))}this.updateMatrices(!0)}addDoor(t,e,i,n){let s=Math.max(.7,t.w||1),r=t.startOpen||0,o={spec:t,kind:i,mesh:e,w:s,angle:r,target:r,x:t.x,y:t.y+t.h/2,z:t.z,ry:t.ry,swing:t.swing||1,collider:null,instance:n,moving:!1};o.baseAngle=t.ry+r*o.swing,r<.35&&this.addCollider(o),this.doors.push(o);let l=Math.floor(t.x/za),c=Math.floor(t.z/za),h=l+","+c;this.grid.has(h)||this.grid.set(h,[]),this.grid.get(h).push(o)}addCollider(t){if(t.collider)return;let e=t.w/2,i=Math.cos(t.ry),n=Math.sin(t.ry),s=Math.abs(i)*e+Math.abs(n)*.1,r=Math.abs(n)*e+Math.abs(i)*.1;t.collider=this.game.world.colliders.addBox(t.x-s,t.y-1.05,t.z-r,t.x+s,t.y+1.05,t.z+r,"door")}removeCollider(t){if(!t.collider)return;let e=this.game.world.colliders,i=t.collider;for(let n of e.map.values()){let s=n.indexOf(i);s>=0&&n.splice(s,1)}e.count=Math.max(0,e.count-1),t.collider=null}nearest(t,e=2.4){let i=null,n=e,s=Math.floor(t.x/za),r=Math.floor(t.z/za);for(let o=s-1;o<=s+1;o++)for(let l=r-1;l<=r+1;l++){let c=this.grid.get(o+","+l);if(c)for(let h of c){let d=Math.hypot(h.x-t.x,h.z-t.z),u=Math.abs(h.y-(t.y+1.1));d<n&&u<2.4&&(i=h,n=d)}}return i}toggle(t){t.target=t.target>.5?0:Math.PI*.62,t.moving=!0,t.target>.5?this.removeCollider(t):this.addCollider(t),this.game.audio.door&&this.game.audio.door(t.target>.5),this.game.audio.playNoise({freq:320,q:1.2,dur:.35,volume:.1,pos:new P(t.x,t.y,t.z),maxDist:18})}update(t){let e=!1;for(let i of this.doors){if(Math.abs(i.angle-i.target)<.001){i.moving=!1;continue}let n=i.angle,s=3.4;i.angle+=Z(i.target-i.angle,-s*t,s*t),Math.abs(i.angle-n)>1e-5&&(e=!0),this.updateInstance(i)}if(e)for(let i of Object.values(this.meshes))i.instanceMatrix.needsUpdate=!0}updateInstance(t){let e=t.mesh;if(!e)return;let i=t.ry+t.angle*t.swing,n=Math.cos(i),s=Math.sin(i),r=t.x-t.w/2*Math.cos(t.ry),o=t.z+t.w/2*Math.sin(t.ry);Ua.makeRotationY(i),Ua.scale(s1.set(t.w,1,1)),Ua.setPosition(r,t.y,o),e.setMatrixAt(t.instance,Ua)}updateMatrices(t=!1){for(let e of this.doors)this.updateInstance(e);for(let e of Object.values(this.meshes))e.instanceMatrix.needsUpdate=!0}serialize(){return this.doors.map(t=>Math.round(t.angle*100)/100)}deserialize(t){if(t){t.forEach((e,i)=>{let n=this.doors[i];n&&(n.angle=n.target=e,e>.5?this.removeCollider(n):this.addCollider(n),this.updateInstance(n))});for(let e of Object.values(this.meshes))e.instanceMatrix.needsUpdate=!0}}},Ua=new Qt,s1=new P;function r1(){let a=rt(.028,.028,.1,6,1);return a.rotateZ(Math.PI/2),a.translate(.82,0,.06),a}function Md(a,t,e,i){let n=[a,t],s=0,r=0;for(let g of n)s+=g.attributes.position.count,r+=g.index?g.index.count:g.attributes.position.count;let o=new Float32Array(s*3),l=new Float32Array(s*3),c=new Float32Array(s*2),h=new Uint32Array(r),d=0,u=0;for(let g of n){let y=g.attributes.position,p=g.attributes.normal,m=g.attributes.uv;if(o.set(y.array.subarray(0,y.count*3),d*3),p&&l.set(p.array.subarray(0,p.count*3),d*3),m&&c.set(m.array.subarray(0,m.count*2),d*2),g.index)for(let x=0;x<g.index.count;x++)h[u++]=g.index.array[x]+d;else for(let x=0;x<y.count;x++)h[u++]=x+d;d+=y.count}let f=new ke;return f.setAttribute("position",new de(o,3)),f.setAttribute("normal",new de(l,3)),f.setAttribute("uv",new de(c,2)),f.setIndex(new de(h,1)),f.computeBoundingSphere(),f}var Sd=`
:root{
  --paper:#d3ccba; --paper-2:#b3ac9a; --dim:#807d70; --dimmer:#5c5a51;
  --bg:#0a0c0a; --panel:rgba(14,16,14,.94); --panel-2:rgba(20,23,19,.96);
  --line:#2c3029; --line-2:#3b4136;
  --amber:#c9963f; --amber-2:#e0b463; --amber-dim:#6f5222;
  --red:#b04632; --red-2:#d4664c; --green:#8fa36a; --blue:#79a0b4; --violet:#9a7fbd;
  --shadow:0 18px 50px rgba(0,0,0,.65);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;background:#050605;overflow:hidden;
  font-family:"Barlow Condensed","Oswald","Arial Narrow",Inter,"Segoe UI",system-ui,sans-serif;
  color:var(--paper);-webkit-font-smoothing:antialiased;user-select:none}
canvas{display:block}
#ui{position:fixed;inset:0;pointer-events:none;z-index:10;font-size:15px;letter-spacing:.02em}
#ui *{pointer-events:none}
#ui .pe,#ui .pe *{pointer-events:auto}
.mono{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-variant-numeric:tabular-nums}
.caps{text-transform:uppercase;letter-spacing:.16em}
.tiny{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.hr{height:1px;background:var(--line);margin:10px 0}
svg{display:block}
.icon{display:inline-flex;align-items:center;justify-content:center}
.icon svg,.st-ic svg{width:100%;height:100%}

/* ------------------------------------------------ HUD shell */
#hud{position:absolute;inset:0;opacity:1;transition:opacity .35s ease}
#hud.hidden{opacity:0}
.hud-corner{position:absolute;width:54px;height:54px;border:1px solid rgba(201,150,63,.25);pointer-events:none}
.hud-corner.tl{top:14px;left:14px;border-right:0;border-bottom:0}
.hud-corner.tr{top:14px;right:14px;border-left:0;border-bottom:0}
.hud-corner.bl{bottom:14px;left:14px;border-right:0;border-top:0}
.hud-corner.br{bottom:14px;right:14px;border-left:0;border-top:0}

/* top-left vitals badge */
#hud-top-left{position:absolute;top:26px;left:30px;min-width:230px}
.lvl-row{display:flex;align-items:center;gap:10px}
.lvl-badge{width:46px;height:46px;border:1px solid var(--amber-dim);background:rgba(10,12,10,.7);
  display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.lvl-badge:after{content:"";position:absolute;inset:3px;border:1px solid rgba(201,150,63,.18)}
.lvl-badge b{font-size:19px;line-height:1;color:var(--amber-2);font-weight:600}
.lvl-badge span{font-size:8px;letter-spacing:.2em;color:var(--dim);margin-top:2px}
.lvl-meta{flex:1}
.lvl-name{font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--paper-2)}
.xp-track{height:3px;background:#20241e;margin-top:6px;position:relative;overflow:hidden}
.xp-fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--amber-dim),var(--amber));transition:width .4s ease}
.xp-text{font-size:10px;color:var(--dim);margin-top:4px;letter-spacing:.12em}
#region-line{font-size:11px;letter-spacing:.26em;color:var(--dimmer);text-transform:uppercase;margin-top:10px}

/* bottom-left meters */
#hud-vitals{position:absolute;left:30px;bottom:26px;width:290px}
.health-block{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.body-mini{width:44px;height:72px;position:relative;opacity:.95}
.body-map{width:100%;height:100%}
.body-map .bp{fill:rgba(20,24,19,.8);stroke:#434a3d;stroke-width:1.4;transition:fill .25s}
.body-map .bp.crit{fill:rgba(140,50,34,.55);stroke:#b04632}
.body-map .bp.hurt{fill:rgba(150,104,44,.42);stroke:#a37b3e}
.body-map .bp.ok{fill:rgba(78,92,58,.45);stroke:#6d7d52}
.meters{flex:1}
.meter{margin-bottom:6px}
.meter-head{display:flex;justify-content:space-between;align-items:baseline;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.meter-head b{font-size:12px;color:var(--paper-2);letter-spacing:.06em}
.track{height:5px;background:#1c201b;margin-top:3px;position:relative;overflow:hidden}
.track .fill{position:absolute;inset:0;width:0;transition:width .25s ease,background .3s}
.track.thin{height:3px}
.fill.health{background:linear-gradient(90deg,#6d8a4c,#a8bd7c)}
.fill.health.low{background:linear-gradient(90deg,#8a3626,#c85b3e)}
.fill.stamina{background:linear-gradient(90deg,#8a7530,#c9ae57)}
.fill.stamina.low{background:linear-gradient(90deg,#6b5a24,#8f7a35)}
.fill.rad{background:linear-gradient(90deg,#5f7a2c,#a8c75a)}
.fill.inf{background:linear-gradient(90deg,#5f7a6a,#8fbfa8)}
.fill.bleed{background:linear-gradient(90deg,#7d2b1e,#c05038)}

.status-strip{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.stat-chip{display:flex;align-items:center;gap:4px;background:rgba(14,17,14,.72);
  border:1px solid var(--line);padding:3px 6px;font-size:10px;letter-spacing:.08em;color:var(--dim)}
.stat-chip b{color:var(--paper-2);font-size:11px;font-weight:500}
.stat-chip .st-ic{color:var(--dimmer)}
.stat-chip.warn{border-color:rgba(176,70,50,.5);color:#d49a86}
.stat-chip.warn .st-ic{color:#c86a50}
.stat-chip.warn b{color:#e0a48e}
.stat-chip.cold{border-color:rgba(90,130,160,.45);color:#8fb2c8}
.stat-chip.cold .st-ic{color:#7aa6be}

.bleed-warn{display:none;align-items:center;gap:8px;margin-top:8px;padding:5px 8px;
  border:1px solid rgba(176,70,50,.55);background:rgba(90,24,16,.35);color:#e0a48e;
  font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;animation:pulse 1.6s infinite}
.bleed-warn.on{display:flex}
@keyframes pulse{0%,100%{opacity:.65}50%{opacity:1}}

/* weapon block */
#hud-weapon{position:absolute;right:30px;bottom:26px;min-width:230px;text-align:right}
.w-name{font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:var(--paper)}
.w-name .w-mode{color:var(--amber);font-size:10px;letter-spacing:.16em;margin-left:8px}
.w-ammo{display:flex;align-items:baseline;justify-content:flex-end;gap:6px;margin-top:2px}
.w-ammo b{font-size:40px;line-height:.95;font-weight:500;color:var(--paper);font-family:"SFMono-Regular",Consolas,monospace}
.w-ammo b.empty{color:var(--red-2)}
.w-ammo i{font-style:normal;font-size:16px;color:var(--dim)}
.w-ammo span{font-size:15px;color:var(--paper-2);font-family:"SFMono-Regular",Consolas,monospace}
.w-sub{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dimmer);margin-top:4px}
.w-durab{height:2px;background:#1e221d;margin-top:7px;position:relative;overflow:hidden}
.w-durab i{position:absolute;left:0;top:0;bottom:0;background:var(--amber);display:block}
#quick-slots{display:flex;gap:5px;justify-content:flex-end;margin-top:10px}
.qslot{width:40px;height:40px;border:1px solid var(--line-2);background:rgba(12,14,12,.72);
  position:relative;display:flex;align-items:center;justify-content:center;color:var(--paper-2)}
.qslot .num{position:absolute;top:1px;left:3px;font-size:8px;color:var(--dimmer);letter-spacing:.1em}
.qslot .cnt{position:absolute;bottom:1px;right:3px;font-size:9px;color:var(--paper-2);font-family:monospace}
.qslot.active{border-color:var(--amber);background:rgba(40,32,16,.6)}
.qslot .icon{width:26px;height:26px}

/* top-right time/weather */
#hud-top-right{position:absolute;top:26px;right:30px;text-align:right}
.clock{font-size:22px;letter-spacing:.1em;font-family:"SFMono-Regular",Consolas,monospace;color:var(--paper)}
.clock small{font-size:10px;letter-spacing:.24em;color:var(--dimmer);display:block;margin-top:2px}
.weather{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--amber);margin-top:8px}
.weather .temp{color:var(--paper-2);margin-left:8px;letter-spacing:.1em}

/* compass */
#compass{position:absolute;top:24px;left:50%;transform:translateX(-50%);width:420px;height:38px;overflow:hidden;
  mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent);
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent)}
#compass-inner{position:absolute;top:0;left:0;height:100%;display:flex;align-items:center;white-space:nowrap}
.cmp-tick{display:inline-block;width:44px;text-align:center;font-size:10px;letter-spacing:.2em;color:var(--dimmer)}
.cmp-tick.card{color:var(--paper-2);font-size:12px}
.cmp-tick.card.n{color:var(--amber-2)}
#compass-center{position:absolute;left:50%;top:0;transform:translateX(-50%);width:1px;height:34px;background:var(--amber);opacity:.8}
#compass-markers{position:absolute;inset:0}
.cmp-marker{position:absolute;top:2px;transform:translateX(-50%);font-size:8px;letter-spacing:.1em;color:var(--amber-2);text-align:center}
.cmp-marker .dot{width:5px;height:5px;background:var(--amber);margin:0 auto 2px;transform:rotate(45deg)}

/* crosshair */
#crosshair{position:absolute;left:50%;top:50%;width:34px;height:34px;transform:translate(-50%,-50%);opacity:.9}
#crosshair .ch{position:absolute;background:rgba(226,220,204,.85);box-shadow:0 0 3px rgba(0,0,0,.9)}
#crosshair .ch.t{width:1px;height:7px;left:16.5px;top:0}
#crosshair .ch.b{width:1px;height:7px;left:16.5px;bottom:0}
#crosshair .ch.l{height:1px;width:7px;top:16.5px;left:0}
#crosshair .ch.r{height:1px;width:7px;top:16.5px;right:0}
#crosshair .dot{position:absolute;width:2px;height:2px;background:var(--amber-2);left:16px;top:16px}
#crosshair.hidden{display:none}
#hitmark{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(45deg);width:22px;height:22px;opacity:0}
#hitmark span{position:absolute;background:#e8e2cf;width:1.5px;height:7px}
#hitmark span:nth-child(1){left:0;top:0}
#hitmark span:nth-child(2){right:0;top:0}
#hitmark span:nth-child(3){left:0;bottom:0}
#hitmark span:nth-child(4){right:0;bottom:0}
#hitmark.show{animation:hit .28s ease-out}
#hitmark.kill span{background:var(--red-2)}
@keyframes hit{0%{opacity:1;transform:translate(-50%,-50%) rotate(45deg) scale(.7)}100%{opacity:0;transform:translate(-50%,-50%) rotate(45deg) scale(1.25)}}

/* damage vignette */
#vignette{position:absolute;inset:0;opacity:0;transition:opacity .18s;
  background:radial-gradient(ellipse at center,transparent 42%,rgba(120,26,16,.55) 100%)}
#lowhealth{position:absolute;inset:0;opacity:0;box-shadow:inset 0 0 160px rgba(120,20,10,.7);transition:opacity .5s}
#radiation-fx{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,transparent 50%,rgba(120,150,60,.24));transition:opacity 1s}

/* prompt, objective, notifications */
#prompt{position:absolute;left:50%;bottom:19%;transform:translateX(-50%);opacity:0;transition:opacity .2s;
  background:rgba(10,12,10,.82);border:1px solid var(--line-2);padding:7px 14px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--paper-2)}
#prompt.on{opacity:1}
#prompt b{color:var(--amber-2);font-weight:500}

#objective{position:absolute;left:30px;top:150px;width:300px;text-align:left;opacity:0;transition:opacity .3s}
#objective.on{opacity:1}
.obj-head{font-size:10px;letter-spacing:.26em;color:var(--amber);text-transform:uppercase}
.obj-title{font-size:14px;letter-spacing:.1em;color:var(--paper);margin-top:3px;text-transform:uppercase}
.obj-list{margin-top:7px;font-size:11.5px;line-height:1.5;color:var(--paper-2)}
.obj-list div{position:relative;padding-right:2px}
.obj-list div:before{content:"\u2014";color:var(--amber-dim);margin-right:6px}
.obj-list div.done{color:var(--dimmer);text-decoration:line-through}
.obj-count{color:var(--amber-2);margin-left:5px;font-family:monospace;font-size:11px}

#notifications{position:absolute;right:30px;top:112px;width:310px;display:flex;flex-direction:column;gap:6px;align-items:stretch}
.note{background:rgba(10,12,10,.9);border-right:2px solid var(--amber);border-left:0;padding:7px 12px 7px 14px;width:100%;text-align:left;
  animation:noteIn .3s ease-out;transition:opacity .4s,transform .4s}
.note.fade{opacity:0;transform:translateY(-6px)}
.note .n-title{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--amber-2)}
.note .n-text{font-size:12px;color:var(--paper-2);margin-top:2px;line-height:1.4;white-space:pre-line}
.note.quest{border-right-color:var(--violet)}
.note.quest .n-title{color:#c0a4d8}
.note.danger{border-right-color:var(--red)}
.note.danger .n-title{color:var(--red-2)}
.note.good{border-right-color:var(--green)}
.note.good .n-title{color:#b6c894}
@keyframes noteIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}

/* boss bar */
#bossbar{position:absolute;left:50%;top:110px;transform:translateX(-50%);width:560px;opacity:0;transition:opacity .4s}
#bossbar.on{opacity:1}
.boss-name{font-size:13px;letter-spacing:.34em;text-transform:uppercase;text-align:center;color:#d9c9a8}
.boss-phases{display:flex;gap:4px;justify-content:center;margin:5px 0 6px}
.boss-phases i{width:64px;height:2px;background:#2a2118}
.boss-phases i.on{background:var(--red)}
.boss-track{height:7px;background:#1a1512;border:1px solid #3a2a22;position:relative;overflow:hidden}
.boss-track i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#7d2b1e,#c05038)}
.boss-tag{text-align:center;font-size:9px;letter-spacing:.3em;color:#8a6a52;margin-top:4px;text-transform:uppercase}

/* ------------------------------------------------ overlays */
.overlay{position:absolute;inset:0;background:rgba(5,6,5,.82);opacity:0;visibility:hidden;
  transition:opacity .22s ease,visibility .22s;backdrop-filter:blur(3px);z-index:20}
.overlay.open{opacity:1;visibility:visible}
.scr{position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:auto}
.scr-head{display:flex;align-items:center;justify-content:space-between;padding:22px 34px 14px;border-bottom:1px solid var(--line)}
.scr-head h1{margin:0;font-size:22px;letter-spacing:.4em;font-weight:400;text-transform:uppercase;color:var(--paper)}
.scr-head .tabs{display:flex;gap:2px}
.tab{padding:8px 15px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);
  border:1px solid transparent;cursor:pointer;transition:color .15s,border-color .15s}
.tab:hover{color:var(--paper-2)}
.tab.on{color:var(--amber-2);border-color:var(--amber-dim);background:rgba(201,150,63,.06)}
.scr-body{flex:1;display:flex;min-height:0;padding:20px 34px 26px;gap:22px}
.scr-foot{padding:10px 34px;border-top:1px solid var(--line);display:flex;justify-content:space-between;
  align-items:center;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.panel{background:var(--panel);border:1px solid var(--line)}
.panel-pad{padding:16px}
.panel-title{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--amber);margin-bottom:12px}
.close-x{width:34px;height:34px;border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;
  color:var(--dim);cursor:pointer;transition:.15s}
.close-x:hover{color:var(--paper);border-color:var(--amber-dim)}
.close-x svg{width:14px;height:14px}
.btn{border:1px solid var(--line-2);background:rgba(24,27,23,.7);color:var(--paper-2);padding:9px 16px;
  font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:.15s;font-family:inherit}
.btn:hover{background:rgba(38,42,34,.9);color:var(--paper);border-color:var(--amber-dim)}
.btn.primary{border-color:var(--amber-dim);color:var(--amber-2);background:rgba(201,150,63,.08)}
.btn.primary:hover{background:rgba(201,150,63,.16)}
.btn.danger{border-color:rgba(176,70,50,.6);color:var(--red-2)}
.btn.danger:hover{background:rgba(140,40,26,.22)}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn.sm{padding:5px 9px;font-size:9.5px;letter-spacing:.14em}

/* ------------------------------------------------ inventory */
.inv-wrap{flex:1;display:grid;grid-template-columns:250px 1fr 290px;gap:20px;min-height:0}
.equip-col{display:flex;flex-direction:column;gap:14px;min-height:0}
.char-doll{position:relative;height:250px;border:1px solid var(--line);background:
  radial-gradient(ellipse at 50% 40%,rgba(50,58,44,.35),rgba(10,12,10,.6));display:flex;align-items:center;justify-content:center}
.char-doll .body-map{height:210px;width:auto;opacity:.9}
.eq-slots{position:absolute;inset:0}
.eq-slot{position:absolute;width:48px;height:48px;border:1px solid var(--line-2);background:rgba(10,12,10,.8);
  display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--paper-2)}
.eq-slot .icon{width:32px;height:32px}
.eq-slot .lbl{position:absolute;bottom:-13px;left:0;right:0;text-align:center;font-size:8px;letter-spacing:.14em;color:var(--dimmer);text-transform:uppercase}
.eq-slot.filled{border-color:var(--amber-dim)}
.eq-slot:hover{border-color:var(--amber)}
.eq-slot[data-slot="head"]{left:6px;top:6px}
.eq-slot[data-slot="body"]{left:6px;top:64px}
.eq-slot[data-slot="back"]{left:6px;top:122px}
.eq-slot[data-slot="light"]{right:6px;top:6px}
.eq-slot[data-slot="utility"]{right:6px;top:64px}
.eq-slot[data-slot="melee"]{right:6px;top:122px}
.eq-slot[data-slot="weapon1"]{left:6px;bottom:8px}
.eq-slot[data-slot="weapon2"]{right:6px;bottom:8px}
@media (max-width:1200px){.eq-slot[data-slot="weapon1"],.eq-slot[data-slot="weapon2"]{display:none}}

.stat-lines{font-size:11px;color:var(--paper-2)}
.stat-line{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(44,48,41,.6)}
.stat-line span{color:var(--dim);letter-spacing:.1em}
.stat-line b{font-weight:500;color:var(--paper)}
.stat-line b.warn{color:var(--red-2)}

.grid-col{display:flex;flex-direction:column;min-height:0}
.grid-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px}
.carry{font-size:11px;color:var(--dim);letter-spacing:.1em}
.carry b{color:var(--paper);font-weight:500}
.carry.over b{color:var(--red-2)}
.inv-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;background:rgba(8,9,8,.5);padding:8px;
  border:1px solid var(--line);position:relative;touch-action:none}
.inv-cell{aspect-ratio:1;background:rgba(22,25,21,.5);border:1px solid rgba(44,48,41,.5);position:relative}
.inv-cell.hover{background:rgba(60,70,50,.35);border-color:var(--line-2)}
.inv-cell.bad{background:rgba(120,40,30,.22);border-color:rgba(176,70,50,.4)}
.item{position:absolute;border:1px solid #4a4d40;background:linear-gradient(160deg,rgba(48,52,44,.92),rgba(26,29,25,.95));
  display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;transition:border-color .12s,filter .12s}
.item:hover{border-color:var(--amber);filter:brightness(1.12)}
.item.sel{border-color:var(--amber-2);box-shadow:0 0 0 1px var(--amber-dim) inset}
.item.dragging{opacity:.4}
.item .icon{width:78%;height:78%}
.item .qty{position:absolute;right:2px;bottom:1px;font-size:10px;color:#e6e0cc;font-family:monospace;text-shadow:0 1px 2px #000}
.item .dur{position:absolute;left:2px;right:2px;bottom:2px;height:2px;background:rgba(0,0,0,.6)}
.item .dur i{display:block;height:100%;background:var(--green)}
.item .dur i.low{background:var(--red)}
.item.rare{border-color:#8a6fa8}
.item.quest{border-color:#9a7fbd}
.inv-foot{display:flex;justify-content:space-between;margin-top:10px;align-items:center}
.gold{display:flex;align-items:center;gap:6px;font-size:12px;letter-spacing:.1em;color:var(--paper-2)}
.gold b{color:var(--amber-2);font-family:monospace;font-size:14px;font-weight:500}
.gold svg{width:14px;height:14px;color:var(--amber)}

.detail-col{display:flex;flex-direction:column;gap:0;min-height:0}
.detail-empty{color:var(--dimmer);font-size:12px;letter-spacing:.14em;text-align:center;padding:40px 10px;text-transform:uppercase}
.d-title{font-size:16px;letter-spacing:.12em;color:var(--paper);text-transform:uppercase}
.d-cat{font-size:9.5px;letter-spacing:.24em;color:var(--amber);text-transform:uppercase;margin-top:3px}
.d-desc{font-size:12px;line-height:1.55;color:var(--paper-2);margin-top:12px}
.d-stats{margin-top:14px;font-size:11px}
.d-stat{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(44,48,41,.55)}
.d-stat span{color:var(--dim);letter-spacing:.12em;text-transform:uppercase}
.d-stat b{font-weight:500;color:var(--paper)}
.d-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
.d-hint{font-size:10px;letter-spacing:.1em;color:var(--dimmer);margin-top:10px;line-height:1.6}
.att-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(44,48,41,.5);font-size:11px}
.att-row span{color:var(--dim)}

/* tooltip */
#tooltip{position:fixed;z-index:60;background:rgba(8,10,8,.97);border:1px solid var(--line-2);padding:10px 12px;
  max-width:260px;opacity:0;transition:opacity .12s;pointer-events:none;box-shadow:var(--shadow)}
#tooltip.on{opacity:1}
#tooltip .tt-name{font-size:12px;letter-spacing:.12em;color:var(--paper);text-transform:uppercase}
#tooltip .tt-cat{font-size:9px;letter-spacing:.22em;color:var(--amber);margin-top:2px;text-transform:uppercase}
#tooltip .tt-desc{font-size:11px;color:var(--dim);margin-top:6px;line-height:1.45}
#tooltip .tt-extra{font-size:10px;color:var(--paper-2);margin-top:6px;line-height:1.5}

/* ------------------------------------------------ skills */
.skill-trees{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;min-height:0}
.tree{border:1px solid var(--line);background:rgba(12,14,12,.55);display:flex;flex-direction:column;min-height:0}
.tree-head{padding:12px 14px;border-bottom:1px solid var(--line);position:relative}
.tree-head h3{margin:0;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--paper)}
.tree-head .t-desc{font-size:10px;color:var(--dimmer);margin-top:4px;line-height:1.4;letter-spacing:.04em}
.tree-head .t-count{position:absolute;right:12px;top:12px;font-size:10px;color:var(--amber);font-family:monospace}
.tree-body{padding:10px 12px 14px;display:flex;flex-direction:column;gap:6px;overflow:auto;min-height:0}
.sk{display:flex;gap:8px;align-items:flex-start;padding:7px 8px;border:1px solid rgba(44,48,41,.8);
  background:rgba(18,21,18,.5);cursor:pointer;transition:.14s;position:relative}
.sk:hover{border-color:var(--line-2);background:rgba(26,30,25,.7)}
.sk.locked{opacity:.5}
.sk.maxed{border-color:rgba(201,150,63,.5)}
.sk.can{border-color:rgba(201,150,63,.35)}
.sk-icon{width:22px;height:22px;border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;
  color:var(--amber);font-size:10px;font-family:monospace;flex:0 0 auto;margin-top:1px}
.sk-main{flex:1;min-width:0}
.sk-name{font-size:11.5px;letter-spacing:.08em;color:var(--paper-2);text-transform:uppercase}
.sk-desc{font-size:10px;color:var(--dimmer);line-height:1.4;margin-top:2px}
.sk-meta{display:flex;justify-content:space-between;margin-top:3px;font-size:9px;letter-spacing:.1em;color:var(--amber-dim)}
.sk-pips{display:flex;gap:2px}
.sk-pips i{width:7px;height:3px;background:#2a2e26}
.sk-pips i.on{background:var(--amber)}
.skill-points{font-size:12px;letter-spacing:.16em;color:var(--amber-2);text-transform:uppercase}
.skill-points b{font-family:monospace;font-size:15px}

/* ------------------------------------------------ journal */
.journal-wrap{flex:1;display:grid;grid-template-columns:250px 1fr;gap:20px;min-height:0}
.act-list{overflow:auto;border:1px solid var(--line)}
.act{padding:10px 14px;border-bottom:1px solid rgba(44,48,41,.6);cursor:pointer}
.act:hover{background:rgba(30,34,28,.5)}
.act.on{background:rgba(201,150,63,.08);border-left:2px solid var(--amber)}
.act .a-num{font-size:9px;letter-spacing:.24em;color:var(--amber-dim)}
.act .a-name{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--paper-2);margin-top:2px}
.act .a-sub{font-size:9.5px;color:var(--dimmer);margin-top:2px}
.quest-list{overflow:auto;padding-right:4px}
.q-card{border:1px solid var(--line);background:rgba(14,16,14,.6);margin-bottom:8px;padding:13px 15px;cursor:pointer;transition:.14s}
.q-card:hover{border-color:var(--line-2);background:rgba(22,25,21,.7)}
.q-card.on{border-color:var(--amber-dim)}
.q-card.done{opacity:.68}
.q-num{font-size:9px;letter-spacing:.24em;color:var(--amber-dim)}
.q-name{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:var(--paper);margin-top:2px}
.q-short{font-size:11px;color:var(--dim);line-height:1.5;margin-top:5px}
.q-obj{margin-top:9px;font-size:11px;color:var(--paper-2)}
.q-obj div{padding:2px 0}
.q-obj div:before{content:"\xB7";color:var(--amber);margin-right:7px}
.q-obj div.done{color:var(--dimmer);text-decoration:line-through}
.q-reward{margin-top:9px;font-size:10px;letter-spacing:.08em;color:var(--dim)}
.q-reward b{color:var(--amber-2);font-weight:500}
.q-tag{display:inline-block;font-size:8.5px;letter-spacing:.2em;padding:2px 6px;border:1px solid var(--line-2);color:var(--dim);margin-left:6px;text-transform:uppercase}
.q-tag.main{border-color:rgba(201,150,63,.45);color:var(--amber)}
.q-tag.done{border-color:rgba(143,163,106,.45);color:var(--green)}
.empty-state{color:var(--dimmer);font-size:12px;text-align:center;padding:60px 20px;letter-spacing:.14em;text-transform:uppercase}

/* ------------------------------------------------ map */
.map-wrap{flex:1;display:grid;grid-template-columns:1fr 260px;gap:20px;min-height:0}
#map-canvas-wrap{border:1px solid var(--line);position:relative;background:#0b0d0b;overflow:hidden}
#map-canvas{width:100%;height:100%;display:block;cursor:crosshair}
.map-legend{position:absolute;left:12px;bottom:12px;font-size:9.5px;color:var(--dim);line-height:1.7;letter-spacing:.1em;background:rgba(8,10,8,.7);padding:8px 10px;border:1px solid var(--line)}
.map-legend i{display:inline-block;width:7px;height:7px;margin-right:6px}
.poi-list{overflow:auto;border:1px solid var(--line)}
.poi-row{padding:8px 12px;border-bottom:1px solid rgba(44,48,41,.5);font-size:11px;display:flex;justify-content:space-between;cursor:pointer}
.poi-row:hover{background:rgba(30,34,28,.5)}
.poi-row .p-name{color:var(--paper-2);letter-spacing:.1em}
.poi-row .p-dist{color:var(--dimmer);font-family:monospace;font-size:10px}
.poi-row.undiscovered .p-name{color:var(--dimmer);font-style:italic}

/* ------------------------------------------------ craft / build */
.craft-wrap{flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;align-content:start;overflow:auto;min-height:0;padding-right:6px}
.recipe{border:1px solid var(--line);background:rgba(14,16,14,.65);padding:13px 15px;display:flex;flex-direction:column}
.recipe.cant{opacity:.6}
.r-head{display:flex;gap:10px;align-items:center}
.r-icon{width:38px;height:38px;border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;color:var(--paper-2)}
.r-icon .icon{width:28px;height:28px}
.r-name{font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--paper)}
.r-sub{font-size:9.5px;letter-spacing:.14em;color:var(--amber);text-transform:uppercase;margin-top:2px}
.r-desc{font-size:10.5px;color:var(--dim);margin:9px 0;line-height:1.5;flex:1}
.r-ing{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.ing{font-size:10px;padding:2px 6px;border:1px solid var(--line-2);color:var(--paper-2);letter-spacing:.06em}
.ing.miss{color:var(--red-2);border-color:rgba(176,70,50,.4)}
.r-foot{display:flex;justify-content:space-between;align-items:center}
.r-time{font-size:9.5px;color:var(--dimmer);letter-spacing:.14em}
.tab-bar{display:flex;gap:2px;margin-bottom:14px;flex-wrap:wrap}

/* ------------------------------------------------ settings */
.settings-wrap{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:26px;overflow:auto;min-height:0;align-content:start;padding-right:6px}
.set-group{border:1px solid var(--line);padding:16px 18px;background:rgba(13,15,13,.6)}
.set-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(44,48,41,.5);gap:12px}
.set-row:last-child{border-bottom:0}
.set-label{font-size:11px;letter-spacing:.1em;color:var(--paper-2)}
.set-label small{display:block;font-size:9.5px;color:var(--dimmer);letter-spacing:.04em;margin-top:2px}
.set-ctl{display:flex;align-items:center;gap:8px;min-width:150px;justify-content:flex-end}
input[type=range]{-webkit-appearance:none;appearance:none;width:130px;height:2px;background:#333a30;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:14px;background:var(--amber);cursor:pointer;border-radius:0}
input[type=range]::-moz-range-thumb{width:10px;height:14px;background:var(--amber);border:0;cursor:pointer;border-radius:0}
.set-val{font-size:10px;color:var(--paper-2);font-family:monospace;min-width:34px;text-align:right}
.seg{display:flex;gap:1px}
.seg button{background:rgba(22,25,21,.7);border:1px solid var(--line-2);color:var(--dim);font-size:9.5px;
  letter-spacing:.1em;padding:4px 8px;cursor:pointer;font-family:inherit;text-transform:uppercase}
.seg button.on{color:var(--amber-2);border-color:var(--amber-dim);background:rgba(201,150,63,.1)}
.keys-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}
.key-row{display:flex;justify-content:space-between;padding:3px 0;font-size:10.5px;color:var(--dim)}
.key-row kbd{font-family:monospace;font-size:10px;background:rgba(30,34,28,.8);border:1px solid var(--line-2);padding:1px 5px;color:var(--paper-2)}

/* ------------------------------------------------ dialogue */
#dialogue{position:absolute;left:50%;bottom:56px;transform:translateX(-50%);width:min(940px,88vw);
  background:linear-gradient(180deg,rgba(10,12,10,.96),rgba(14,17,14,.98));border:1px solid #3a3f34;
  box-shadow:var(--shadow);opacity:0;visibility:hidden;transition:.2s;z-index:30}
#dialogue.open{opacity:1;visibility:visible}
.dlg-head{display:flex;align-items:center;gap:14px;padding:14px 20px 10px;border-bottom:1px solid var(--line)}
.dlg-portrait{width:52px;height:52px;border:1px solid var(--line-2);background:rgba(20,24,19,.9);
  display:flex;align-items:center;justify-content:center;font-size:19px;color:var(--amber);letter-spacing:.04em;
  font-family:"Barlow Condensed","Arial Narrow",sans-serif;position:relative;overflow:hidden}
.dlg-portrait:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(201,150,63,.12))}
.dlg-id{flex:1}
.dlg-name{font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:var(--paper)}
.dlg-role{font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--amber-dim);margin-top:2px}
.dlg-body{padding:16px 22px 6px;min-height:86px}
.dlg-text{font-size:14.5px;line-height:1.65;color:var(--paper-2);letter-spacing:.015em;white-space:pre-line;max-width:78ch}
.dlg-caret{display:inline-block;width:6px;height:14px;background:var(--amber);margin-left:2px;animation:blink 1s steps(2) infinite;vertical-align:-2px}
@keyframes blink{50%{opacity:0}}
.dlg-choices{padding:6px 22px 18px;display:flex;flex-direction:column;gap:3px}
.dlg-choice{display:flex;gap:10px;align-items:baseline;padding:6px 9px;font-size:12.5px;color:var(--paper-2);
  border-left:1px solid transparent;cursor:pointer;letter-spacing:.02em;transition:.12s}
.dlg-choice:hover,.dlg-choice.hl{color:var(--paper);border-left-color:var(--amber);background:rgba(201,150,63,.06)}
.dlg-choice .n{font-size:9.5px;color:var(--amber-dim);font-family:monospace;min-width:14px}
.dlg-choice.dim{color:var(--dimmer)}

/* ------------------------------------------------ shop */
#shop{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(980px,92vw);height:min(620px,84vh);
  display:flex;flex-direction:column;background:rgba(10,12,10,.97);border:1px solid #3a3f34;box-shadow:var(--shadow);
  opacity:0;visibility:hidden;transition:.2s;z-index:31}
#shop.open{opacity:1;visibility:visible}
.shop-body{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:0}
.shop-col{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--line)}
.shop-col:last-child{border-right:0}
.shop-col h3{margin:0;padding:12px 16px;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--amber);border-bottom:1px solid var(--line)}
.shop-list{flex:1;overflow:auto;padding:6px}
.shop-row{display:flex;align-items:center;gap:10px;padding:7px 8px;border-bottom:1px solid rgba(44,48,41,.45);cursor:pointer}
.shop-row:hover{background:rgba(30,34,28,.55)}
.shop-row .icon{width:30px;height:30px;flex:0 0 auto}
.shop-row .s-main{flex:1;min-width:0}
.shop-row .s-name{font-size:11.5px;color:var(--paper-2);letter-spacing:.06em}
.shop-row .s-qty{font-size:9.5px;color:var(--dimmer);font-family:monospace}
.shop-row .s-price{font-size:11px;color:var(--amber-2);font-family:monospace;min-width:44px;text-align:right}

/* ------------------------------------------------ medical */
.med-wrap{flex:1;display:grid;grid-template-columns:300px 1fr;gap:24px;min-height:0}
.med-doll{border:1px solid var(--line);background:radial-gradient(ellipse at 50% 40%,rgba(50,58,44,.3),rgba(10,12,10,.6));
  display:flex;align-items:center;justify-content:center;position:relative}
.med-doll .body-map{height:74%;width:auto}
.med-parts{display:flex;flex-direction:column;gap:8px;overflow:auto;min-height:0}
.med-part{border:1px solid var(--line);padding:10px 12px;background:rgba(14,16,14,.6)}
.med-part.crit{border-color:rgba(176,70,50,.5)}
.med-part-head{display:flex;justify-content:space-between;align-items:baseline}
.med-part-name{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--paper-2)}
.med-part-val{font-size:10px;color:var(--dim);font-family:monospace}
.med-bar{height:4px;background:#1c201b;margin:6px 0}
.med-bar i{display:block;height:100%;background:linear-gradient(90deg,#6d8a4c,#a8bd7c)}
.med-bar i.mid{background:linear-gradient(90deg,#8a7530,#c9ae57)}
.med-bar i.bad{background:linear-gradient(90deg,#8a3626,#c85b3e)}
.med-tags{display:flex;gap:5px;flex-wrap:wrap}
.med-tag{font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;padding:1px 5px;border:1px solid rgba(176,70,50,.45);color:var(--red-2)}
.med-tag.ok{border-color:rgba(143,163,106,.35);color:var(--green)}
.med-actions{display:flex;gap:5px;margin-top:7px;flex-wrap:wrap}

/* ------------------------------------------------ pause / main menu / death */
#pause,#death,#mainmenu{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  opacity:0;visibility:hidden;transition:.25s;z-index:40}
#pause.open,#death.open,#mainmenu.open{opacity:1;visibility:visible}
#pause{background:rgba(6,7,6,.86);backdrop-filter:blur(6px)}
.pause-box{width:380px;border:1px solid var(--line-2);background:var(--panel);padding:26px 28px;box-shadow:var(--shadow)}
.pause-box h2{margin:0 0 4px;font-size:14px;letter-spacing:.42em;text-transform:uppercase;color:var(--paper);font-weight:400}
.pause-box .p-sub{font-size:9.5px;letter-spacing:.22em;color:var(--dimmer);text-transform:uppercase;margin-bottom:20px}
.pause-box .btn{width:100%;margin-bottom:7px;text-align:left;padding:11px 15px}

#death{background:radial-gradient(ellipse at center,rgba(40,10,8,.5),rgba(4,4,4,.94));flex-direction:column;z-index:41}
.death-title{font-size:56px;letter-spacing:.5em;text-transform:uppercase;color:#b8483a;font-weight:300;
  text-shadow:0 0 40px rgba(160,40,20,.45);margin-bottom:6px}
.death-sub{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#8a6a5c;margin-bottom:30px}
.death-stats{display:flex;gap:34px;margin-bottom:34px}
.death-stat{text-align:center}
.death-stat b{display:block;font-size:24px;color:var(--paper-2);font-family:monospace;font-weight:400}
.death-stat span{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--dimmer)}

#mainmenu{background:radial-gradient(ellipse at 50% 120%,rgba(60,52,34,.4),rgba(5,6,5,.96));flex-direction:column;z-index:50}
.mm-title{text-align:center;margin-bottom:6px}
.mm-title h1{margin:0;font-size:64px;letter-spacing:.24em;font-weight:300;text-transform:uppercase;
  color:#ded6c0;text-shadow:0 2px 50px rgba(0,0,0,.9)}
.mm-title h2{margin:6px 0 0;font-size:13px;letter-spacing:.9em;color:var(--amber);font-weight:400;text-transform:uppercase}
.mm-sub{margin-top:22px;font-size:10px;letter-spacing:.34em;color:var(--dimmer);text-transform:uppercase}
.mm-menu{margin-top:38px;display:flex;flex-direction:column;gap:4px;width:270px}
.mm-menu .btn{text-align:left;padding:12px 18px;font-size:11px;letter-spacing:.26em}
.mm-foot{position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:9.5px;letter-spacing:.26em;color:var(--dimmer);text-transform:uppercase}
.mm-build{position:absolute;top:26px;right:30px;font-size:9.5px;letter-spacing:.2em;color:var(--dimmer);text-align:right;line-height:1.7}
#loading{position:absolute;inset:0;background:#060706;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:60;transition:opacity .6s}
#loading.done{opacity:0;pointer-events:none}
.load-title{font-size:13px;letter-spacing:.5em;color:var(--paper-2);text-transform:uppercase;margin-bottom:20px}
.load-bar{width:320px;height:2px;background:#1c201b;position:relative;overflow:hidden}
.load-bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--amber);transition:width .3s}
.load-step{font-size:9.5px;letter-spacing:.22em;color:var(--dimmer);text-transform:uppercase;margin-top:10px;height:14px}
.load-tip{position:absolute;bottom:40px;font-size:10px;letter-spacing:.16em;color:var(--dimmer);max-width:520px;text-align:center;line-height:1.7}

/* scrollbars */
 ::-webkit-scrollbar{width:7px;height:7px}
::-webkit-scrollbar-track{background:rgba(12,14,12,.6)}
::-webkit-scrollbar-thumb{background:#333a30;border:1px solid #22261f}
::-webkit-scrollbar-thumb:hover{background:#4a5242}

/* fades */
.fade-in{animation:fadeIn .25s ease-out}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.hidden{display:none!important}
.no-anim *{transition:none!important;animation:none!important}
`;var Ed={weapon:"#c9a05a",ammo:"#c2a06a",food:"#b07a4a",water:"#7aa6be",medicine:"#a3b784",materials:"#9c9a88",electronics:"#6fa392",quest:"#b08fc0",armor:"#93977f",equipment:"#a78f63"};function a1(a){return a&&(Ed[a.cat]||Ed[a.type])||"#9c9a88"}var o1=a=>`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${a}</svg>`,nn={knife:'<path d="M14 34 L30 10 L34 12 L20 36 Z"/><path d="M14 34 L10 40 L16 38 Z"/><path d="M17 31 L21 33"/>',pipe:'<path d="M12 38 L34 10"/><path d="M10 34 L16 40 L20 36 L14 30 Z"/><path d="M31 7 L39 15"/>',axe:'<path d="M20 40 L28 8"/><path d="M27 9 C36 8 41 14 40 20 C35 22 29 20 26 15 Z"/><path d="M17 37 L23 41"/>',machete:'<path d="M13 39 C22 30 32 20 40 8 C41 18 36 30 24 38 Z"/><path d="M12 38 L9 42"/><path d="M16 34 L20 38"/>',pistol:'<path d="M9 17 H34 V23 H19 L16 31 H11 Z"/><path d="M34 19 H39 V22 H34"/><path d="M9 17 V23"/><path d="M11 31 L14 37 H18 L16 31"/>',revolver:'<path d="M8 18 H33 V23 H22 L19 30 H12 Z"/><circle cx="24" cy="26" r="4"/><path d="M33 19 H40"/><path d="M12 30 L14 36 L18 36"/>',shotgun:'<path d="M4 22 H30 V26 H4 Z"/><path d="M30 21 L41 19 V25 L30 26"/><path d="M4 26 L11 33 H16 L14 26"/><path d="M17 26 L16 31"/>',rifle:'<path d="M3 23 H30 V26 H3 Z"/><path d="M30 22 L44 21 V25 L30 26"/><path d="M13 26 L11 32 H16 L18 26"/><path d="M20 19 H26 V22 H20"/><path d="M8 26 L6 30"/>',smg:'<path d="M8 19 H30 V24 H20 L18 30 H12 Z"/><path d="M12 24 L11 32 H15 L16 24"/><path d="M30 20 H36 V23 H30"/><path d="M22 24 V29"/>',bow:'<path d="M16 8 C30 16 30 32 16 40"/><path d="M16 8 L16 40"/><path d="M16 24 H40"/><path d="M36 21 L41 24 L36 27"/>'},Fa={ammo:'<rect x="12" y="16" width="7" height="20" rx="1"/><rect x="21" y="12" width="7" height="24" rx="1"/><rect x="30" y="16" width="7" height="20" rx="1"/><path d="M15.5 16 V12 M24.5 12 V8 M33.5 16 V12"/>',food:'<rect x="13" y="14" width="22" height="24" rx="2"/><path d="M13 20 H35 M13 32 H35"/><circle cx="24" cy="26" r="3"/>',water:'<path d="M19 8 H29 V15 L33 21 V38 A2 2 0 0 1 31 40 H17 A2 2 0 0 1 15 38 V21 L19 15 Z"/><path d="M15 27 H33"/><path d="M21 33 H27"/>',medicine:'<rect x="11" y="14" width="26" height="24" rx="3"/><path d="M24 19 V33 M17 26 H31"/>',materials:'<path d="M10 30 L24 12 L38 30 Z"/><path d="M16 30 L24 20 L32 30"/><path d="M8 36 H40"/>',electronics:'<rect x="13" y="13" width="22" height="22" rx="2"/><rect x="20" y="20" width="8" height="8"/><path d="M18 13 V8 M24 13 V8 M30 13 V8 M18 35 V40 M24 35 V40 M30 35 V40 M13 18 H8 M13 24 H8 M13 30 H8 M35 18 H40 M35 24 H40 M35 30 H40"/>',quest:'<path d="M12 12 H30 L36 18 V36 H12 Z"/><path d="M30 12 V18 H36"/><path d="M18 22 H30 M18 27 H28"/>',armor:'<path d="M16 10 L24 13 L32 10 L38 14 V22 C38 32 32 37 24 40 C16 37 10 32 10 22 V14 Z"/><path d="M24 14 V38"/>',equipment:'<path d="M14 18 H34 L32 40 H16 Z"/><path d="M14 18 C14 12 19 8 24 8 C29 8 34 12 34 18"/><path d="M20 24 H28"/>',default:'<rect x="12" y="12" width="24" height="24" rx="2"/><path d="M12 20 H36 M20 12 V36"/>'};function vi(a,t,e={}){let i=e.size||34,n=null;if(t&&t.type&&nn[t.type]?n=nn[t.type]:a&&nn[a]&&(n=nn[a]),!n&&t&&((t.cat==="weapon"||t.type)&&(/shotgun/.test(a)?n=nn.shotgun:/rifle|ak/.test(a)?n=nn.rifle:/pistol|revolver/.test(a)?n=nn.pistol:/knife|axe|machete|pipe/.test(a)&&(n=nn.knife)),!n)){let r=t.cat||"materials";r==="weapon"?n=nn.rifle:/^ammo_/.test(a)?n=Fa.ammo:n=Fa[r]||Fa.default}n||(n=Fa.default);let s=e.color||a1(t);return`<span class="icon" style="width:${i}px;height:${i}px;color:${s}">${o1(n)}</span>`}var Ni=a=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${a}</svg>`,On={health:Ni('<path d="M3 12 H7 L9 8 L12 16 L15 10 L17 12 H21"/>'),stamina:Ni('<path d="M13 3 L6 13 H11 L10 21 L18 10 H12 Z"/>'),hunger:Ni('<path d="M7 3 V11 M5 3 V8 M9 3 V8 M7 11 V21"/><path d="M16 3 C19 5 19 10 16 12 V21"/>'),thirst:Ni('<path d="M12 3 C12 3 6 10 6 14 A6 6 0 0 0 18 14 C18 10 12 3 12 3 Z"/>'),radiation:Ni('<circle cx="12" cy="12" r="2"/><path d="M12 10 C10 5 12 3 12 3 C13 5 13 7 12 10"/><path d="M14 13 C19 13 21 11 21 11 C19 12 17 14 14 13"/><path d="M10 13 C5 13 3 15 3 15 C5 14 7 12 10 13"/>'),infection:Ni('<circle cx="12" cy="12" r="7"/><circle cx="9" cy="10" r="1"/><circle cx="14" cy="9" r="1"/><circle cx="15" cy="14" r="1"/><circle cx="10" cy="15" r="1"/>'),temp:Ni('<path d="M10 4 A2 2 0 0 1 14 4 V14 A3.5 3.5 0 1 1 10 14 Z"/><path d="M12 8 V16"/>'),fatigue:Ni('<path d="M20 14 A8 8 0 1 1 10 4 A6 6 0 0 0 20 14 Z"/>'),stress:Ni('<path d="M3 12 H6 L8 7 L11 17 L14 5 L17 15 L19 12 H21"/>'),weight:Ni('<path d="M12 6 A2 2 0 1 0 12 10 A2 2 0 0 0 12 6"/><path d="M5 7 H9 M15 7 H19"/><path d="M6 7 L9 20 H15 L18 7"/>'),bleed:Ni('<path d="M12 3 C12 3 5 11 5 15 A7 7 0 0 0 19 15 C19 11 12 3 12 3 Z"/><path d="M9 15 H15"/>')};function Ec(a,t=13){return`<span class="st-ic" style="width:${t}px;height:${t}px">${On[a]||On.health}</span>`}var Ba=[{id:"head",label:"Head",x:31,y:6,w:14,h:18},{id:"torso",label:"Torso",x:27,y:25,w:22,h:38},{id:"armL",label:"Left Arm",x:13,y:26,w:12,h:40},{id:"armR",label:"Right Arm",x:51,y:26,w:12,h:40},{id:"legL",label:"Left Leg",x:27,y:63,w:10,h:58},{id:"legR",label:"Right Leg",x:39,y:63,w:10,h:58}];function ar(a=()=>""){return`<svg viewBox="0 0 76 124" class="body-map">${Ba.map(e=>{let n=e.id==="head"?`<ellipse cx="${e.x+e.w/2}" cy="${e.y+e.h/2}" rx="${e.w/2}" ry="${e.h/2}"/>`:`<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="${e.id==="torso"?5:4}"/>`;return`<g class="bp ${a(e.id)}" data-part="${e.id}">${n}</g>`}).join("")}</svg>`}var bi={arrowL:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5 L8 12 L15 19"/></svg>',arrowR:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5 L16 12 L9 19"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>',rotate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 12 A8 8 0 1 1 14 4"/><path d="M14 4 L10 1 M14 4 L10 7"/></svg>',sort:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7 H20 M6 12 H18 M9 17 H15"/></svg>',drop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4 V16 M7 11 L12 17 L17 11"/><path d="M4 20 H20"/></svg>',use:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12 H16 M12 7 L17 12 L12 17"/><path d="M19 4 V20"/></svg>',equip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 V15 M7 8 L12 3 L17 8"/><path d="M5 17 V20 H19 V17"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21 C12 21 19 14 19 9 A7 7 0 0 0 5 9 C5 14 12 21 12 21 Z"/><circle cx="12" cy="9" r="2.4"/></svg>',skull:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 11 A7 7 0 0 1 19 11 V15 L16 17 V20 H8 V17 L5 15 Z"/><circle cx="9.5" cy="11" r="1.4"/><circle cx="14.5" cy="11" r="1.4"/><path d="M10 17 V20 M14 17 V20"/></svg>',quest:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8 V12 L15 14"/></svg>'};var Td=(a,t,e)=>{let i=document.createElement(a);return t&&(i.className=t),e!==void 0&&(i.innerHTML=e),i},Ad=[{id:"hunger",label:"Food",icon:"hunger",warn:22,dir:"low"},{id:"thirst",label:"Water",icon:"thirst",warn:22,dir:"low"},{id:"radiation",label:"Rad",icon:"radiation",warn:35,dir:"high"},{id:"infection",label:"Inf",icon:"infection",warn:30,dir:"high"},{id:"temp",label:"Temp",icon:"temp",warn:0,dir:"low",base:!0},{id:"fatigue",label:"Fatigue",icon:"fatigue",warn:70,dir:"high"},{id:"stress",label:"Stress",icon:"stress",warn:55,dir:"high"}],Ha=class{constructor(t){this.game=t,this.root=Td("div",""),this.root.id="hud",this.promptText=null,this.boss=null,this.objective=null,this.noteTimers=[],this.lastVitals={},this.build()}build(){let t=this.root;t.innerHTML=`
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>

      <div id="hud-top-left">
        <div class="lvl-row">
          <div class="lvl-badge"><b id="hud-level">1</b><span>LEVEL</span></div>
          <div class="lvl-meta">
            <div class="lvl-name" id="hud-name">SURVIVOR</div>
            <div class="xp-track"><i class="xp-fill" id="hud-xp"></i></div>
            <div class="xp-text mono" id="hud-xptext">0 / 120 XP</div>
          </div>
        </div>
        <div id="region-line">DEAD SUBURBS</div>
      </div>

      <div id="compass"><div id="compass-inner"></div><div id="compass-markers"></div><div id="compass-center"></div></div>

      <div id="hud-top-right">
        <div class="clock" id="hud-clock">06:00<small id="hud-day">DAY 1 \xB7 CLEAR</small></div>
        <div class="weather" id="hud-weather">OVERCAST<span class="temp" id="hud-temp">+4\xB0C</span></div>
      </div>

      <div id="hud-vitals">
        <div class="health-block">
          <div class="body-mini">${ar(e=>"ok")}</div>
          <div class="meters">
            <div class="meter">
              <div class="meter-head"><span>Health</span><b class="mono" id="hud-hp">100</b></div>
              <div class="track"><i class="fill health" id="hud-hpbar"></i></div>
            </div>
            <div class="meter">
              <div class="meter-head"><span>Stamina</span><b class="mono" id="hud-st">100</b></div>
              <div class="track"><i class="fill stamina" id="hud-stbar"></i></div>
            </div>
          </div>
        </div>
        <div class="status-strip" id="hud-status"></div>
        <div class="bleed-warn" id="hud-bleed">${Ec("bleed",12)} BLEEDING \u2014 USE A BANDAGE (H)</div>
      </div>

      <div id="hud-weapon">
        <div class="w-name" id="hud-wname">UNARMED<span class="w-mode" id="hud-wmode"></span></div>
        <div class="w-ammo"><b class="mono" id="hud-mag">\u2014</b><i>/</i><span id="hud-reserve">\u2014</span></div>
        <div class="w-sub" id="hud-wsub">NO WEAPON EQUIPPED</div>
        <div class="w-durab"><i id="hud-durab" style="width:100%"></i></div>
        <div id="quick-slots"></div>
      </div>

      <div id="crosshair"><i class="ch t"></i><i class="ch b"></i><i class="ch l"></i><i class="ch r"></i><i class="dot"></i></div>
      <div id="hitmark"><span></span><span></span><span></span><span></span></div>

      <div id="vignette"></div><div id="lowhealth"></div><div id="radiation-fx"></div>

      <div id="prompt"></div>
      <div id="objective">
        <div class="obj-head" id="obj-head">CURRENT OBJECTIVE</div>
        <div class="obj-title" id="obj-title"></div>
        <div class="obj-list" id="obj-list"></div>
      </div>
      <div id="notifications"></div>

      <div id="bossbar">
        <div class="boss-name" id="boss-name"></div>
        <div class="boss-phases" id="boss-phases"></div>
        <div class="boss-track"><i id="boss-fill" style="width:100%"></i></div>
        <div class="boss-tag" id="boss-tag"></div>
      </div>
    `,this.els={};for(let e of["hud-level","hud-name","hud-xp","hud-xptext","region-line","hud-clock","hud-day","hud-weather","hud-temp","hud-hp","hud-hpbar","hud-st","hud-stbar","hud-status","hud-bleed","hud-wname","hud-wmode","hud-mag","hud-reserve","hud-wsub","hud-durab","quick-slots","crosshair","hitmark","vignette","lowhealth","radiation-fx","prompt","objective","obj-head","obj-title","obj-list","notifications","bossbar","boss-name","boss-phases","boss-fill","boss-tag","compass","compass-inner","compass-markers","hud-vitals"])this.els[e]=this.root.querySelector("#"+e)||this.root.querySelector("."+e);this.els["hud-status"].innerHTML=Ad.map(e=>`<div class="stat-chip" data-m="${e.id}">${Ec(e.icon,11)}<b data-v="${e.id}">--</b></div>`).join(""),this.chipEls={};for(let e of this.els["hud-status"].children)this.chipEls[e.dataset.m]=e;this.chipVals={};for(let e of Object.keys(this.chipEls))this.chipVals[e]=this.chipEls[e].querySelector("b");this.bodyParts={};for(let e of this.root.querySelectorAll(".body-mini .bp"))this.bodyParts[e.dataset.part]=e;this.els["quick-slots"].innerHTML=[1,2,3,4].map(e=>`<div class="qslot" data-i="${e}"><span class="num">${e}</span><span class="cnt"></span></div>`).join(""),this.qSlots=[...this.els["quick-slots"].children],this.buildCompass(),this.crosshair=this.els.crosshair,this.marker=this.els.hitmark}buildCompass(){let t={0:"N",45:"NE",90:"E",135:"SE",180:"S",225:"SW",270:"W",315:"NW"},e="";for(let i=-1;i<=1;i++)for(let n=0;n<360;n+=10){let s=t[n];e+=`<div class="cmp-tick ${s?"card "+s.toLowerCase():""}" data-deg="${n}">${s||(n%30===0?n:"\xB7")}</div>`}this.els["compass-inner"].innerHTML=e,this.cmpBase=this.els["compass-inner"].querySelectorAll(".cmp-tick").length/3}attach(t){t.appendChild(this.root)}setVisible(t){this.root.classList.toggle("hidden",!t)}update(t){let e=this.game,i=e.player;if(!i)return;let n=i.stats,s=e.level||1,r=e.xp||0,o=e.xpToNext?e.xpToNext(s):120;this.els["hud-level"].textContent=s,this.els["hud-xp"].style.width=Z(r/o*100,0,100)+"%",this.els["hud-xptext"].textContent=`${Math.floor(r)} / ${o} XP`;let l=e.world.regionAt(i.pos.x,i.pos.z);this.els["region-line"].textContent=(l?.name||l?.id||"ASHES").toString().toUpperCase();let c=Z(n.health/n.healthMax,0,1);this.els["hud-hp"].textContent=Math.ceil(n.health),this.els["hud-hpbar"].style.width=c*100+"%",this.els["hud-hpbar"].classList.toggle("low",c<.3);let h=Z(i.stamina/(i.staminaMax||100),0,1);this.els["hud-st"].textContent=Math.round(i.stamina),this.els["hud-stbar"].style.width=h*100+"%",this.els["hud-stbar"].classList.toggle("low",h<.2);for(let f of Ad){let g=(f.base,n[f.id]),y=this.chipVals[f.id];if(!y)continue;let p;f.id==="temp"?p=Math.round(g)+"\xB0":(f.id==="radiation"||f.id==="infection"||f.id,p=Math.round(g)),this.lastVitals[f.id]!==p&&(y.textContent=p,this.lastVitals[f.id]=p);let m=f.dir==="high"?g>=f.warn:g<=f.warn,x=this.chipEls[f.id];x.classList.toggle("warn",m&&f.warn>0),f.id==="temp"&&x.classList.toggle("cold",g<35)}if(e.body)for(let[f,g]of Object.entries(this.bodyParts)){let y=e.body.partCondition(f);g.classList.remove("ok","hurt","crit"),g.classList.add(y>66?"ok":y>33?"hurt":"crit")}this.els["hud-bleed"].classList.toggle("on",n.bleed>1);let d=c<.35;this.els.lowhealth.style.opacity=d?.55+Math.sin(performance.now()/340)*.2:0,this.els["radiation-fx"].style.opacity=Z(n.radiation/130,0,.9),this.updateWeapon(),this.updateQuickSlots();let u=e.sky;if(u){let f=Math.floor((u.hour??6)%24),g=Math.floor((u.hour??6)%1*60);this.els["hud-clock"].firstChild.textContent=String(f).padStart(2,"0")+":"+String(g).padStart(2,"0"),this.els["hud-day"].textContent=`DAY ${e.day||1} \xB7 ${(u.weather||"clear").replace(/_/g," ").toUpperCase()}`,this.els["hud-weather"].firstChild.textContent=(u.weather||"clear").replace(/_/g," ").toUpperCase(),this.els["hud-temp"].textContent=Math.round(n.temp-20)+"\xB0C"}this.updateCompass(i),this.updateObjective()}updateCompass(t){let i=(-t.yaw*180/Math.PI%360+360)%360,n=this.els.compass.clientWidth||420,s=n/150,r=n/2-i*s;this.els["compass-inner"].style.transform=`translateX(${r-this.cmpBase*44}px)`;let o="",l=this.game.world.pois||[];for(let c of l){if(!c.discovered)continue;let h=c.x-t.pos.x,d=c.z-t.pos.z;if(Math.hypot(h,d)>360)continue;let g=(Math.atan2(h,-d)*180/Math.PI-i+540)%360-180;if(Math.abs(g)>62)continue;let y=n/2+g*s;o+=`<div class="cmp-marker" style="left:${y}px"><div class="dot"></div></div>`}this.els["compass-markers"].innerHTML=o}updateWeapon(){let t=this.game,e=t.weapons,i=e?.current,n=i&&(t.itemDef(i)||e.def)||null;if(!i||!n){this.els["hud-wname"].dataset.k!=="none"&&(this.els["hud-wname"].firstChild.textContent="UNARMED",this.els["hud-wmode"].textContent="",this.els["hud-mag"].textContent="\u2014",this.els["hud-reserve"].textContent="\u2014",this.els["hud-wsub"].textContent="NO WEAPON EQUIPPED",this.els["hud-durab"].style.width="0%",this.els["hud-wname"].dataset.k="none");return}let s=e.state||{},r=n.type==="melee"||n.type==="bow",o=i+":"+(s.mag??0)+":"+(s.durability??1)+":"+(s.reserve||0)+":"+(s.reloading?1:0);if(this.els["hud-wname"].dataset.k===o)return;this.els["hud-wname"].dataset.k=o,this.els["hud-wname"].firstChild.textContent=(n.name||i).toUpperCase();let l=r?n.type==="bow"?"BOW":"MELEE":(n.auto?"AUTO":"SEMI").toUpperCase();if(this.els["hud-wmode"].textContent=s.reloading?"RELOADING":l,r)this.els["hud-mag"].textContent="\u2014",this.els["hud-reserve"].textContent="\u2014",this.els["hud-wsub"].textContent=n.type==="bow"?`${n.dmg} DMG \xB7 ${t.inventory.countAmmo(n.reserveType)} BOLTS`:`MELEE \xB7 ${n.dmg} DMG`;else{let h=s.mag??0;this.els["hud-mag"].textContent=h,this.els["hud-mag"].classList.toggle("empty",h===0),this.els["hud-reserve"].textContent=s.reserve??0,this.els["hud-wsub"].textContent=`${n.dmg} DMG \xB7 ${n.range}M RANGE`}let c=Z((s.durability??1)*100,0,100);this.els["hud-durab"].style.width=c+"%",this.els["hud-durab"].style.background=c<25?"var(--red)":c<55?"#c9a05a":"var(--green)"}updateQuickSlots(){let t=this.game,e=t.inventory.quickSlots||[];for(let i=0;i<4;i++){let n=this.qSlots[i],s=e[i];if(!s){n.innerHTML=`<span class="num">${i+1}</span>`,n.classList.remove("active");continue}let r=t.itemDef(s),o=t.inventory.count(s);n.innerHTML=`<span class="num">${i+1}</span>${vi(s,r,{size:24})}${o>1?`<span class="cnt">${o}</span>`:""}`,n.classList.toggle("active",t.weapons?.current?.id===s||t.selectedQuick===i)}}updateObjective(){let t=this.game.objectives||[];if(!t.length){this.els.objective.classList.remove("on");return}this.els.objective.classList.add("on");let e=this.game.quests.trackedQuest();this.els["obj-head"].textContent=e?e.act?`ACT ${e.act} \xB7 ${e.name}`:e.name:"OBJECTIVES",this.els["obj-title"].textContent=e&&e.objectives[0]?.desc||"",this.els["obj-title"].style.display=e?"none":"block";let i=t.map(n=>n.text+n.done+n.cur).join("|");i!==this._objSig&&(this._objSig=i,this.els["obj-list"].innerHTML=t.map(n=>`<div class="${n.done?"done":""}">${n.text}${n.max>1?`<span class="obj-count">${n.cur}/${n.max}</span>`:""}</div>`).join(""))}notify(t,e="",i=null,n=""){let s=t+"|"+e,r=performance.now();this._noteSigs=this._noteSigs||new Map;let o=this._noteSigs.get(s);if(o&&r-o<1200)return null;this._noteSigs.set(s,r),this._noteSigs.size>24&&this._noteSigs.clear();let l=Td("div","note "+n);l.innerHTML=`<div class="n-title" style="${i?"color:"+i:""}">${t}</div>${e?`<div class="n-text">${e}</div>`:""}`;let c=this.els.notifications;for(c.appendChild(l);c.children.length>3;){let d=c.firstElementChild;if(d.remove(),this.noteTimers=this.noteTimers.filter(u=>u.node!==d),!d)break}let h={node:l,t:0,life:n==="quest"?5.2:3.6};for(this.noteTimers.push(h);this.noteTimers.length>4;)this.noteTimers.shift().node.remove();return l}notifyQuest(t,e){return this.notify(t,e,null,"quest")}toast(t,e,i){return this.notify(t,e,null,i)}updateNotifications(t){for(let e=this.noteTimers.length-1;e>=0;e--){let i=this.noteTimers[e];i.t+=t,i.t>i.life&&i.node.classList.add("fade"),i.t>i.life+.5&&(i.node.remove(),this.noteTimers.splice(e,1))}}setPrompt(t){if(this.promptText=t,!t){this.els.prompt.classList.remove("on");return}let e=t.match(/^\[([A-Z])\]\s*(.*)$/);this.els.prompt.innerHTML=e?`<b>${e[1]}</b> &nbsp;${e[2]}`:t,this.els.prompt.classList.add("on")}promptVisible(){return this.els.prompt.classList.contains("on")}hitMarker(t=!1){let e=this.marker;e.classList.remove("show","kill"),e.offsetWidth,e.classList.toggle("kill",!!t),e.classList.add("show")}flashDamage(t=1){let e=this.els.vignette;e.style.opacity=Z(.35+t*.4,0,1),clearTimeout(this._vT),this._vT=setTimeout(()=>{e.style.opacity=0},220)}showBoss(t,e,i,n=""){this.els.bossbar.classList.add("on"),this.els["boss-name"].textContent=t,this.els["boss-tag"].textContent=n;let r="";for(let o=0;o<i;o++)r+=`<i class="${o<e?"on":""}"></i>`;this.els["boss-phases"].innerHTML=r}setBossHP(t){this.els["boss-fill"].style.width=Z(t,0,1)*100+"%"}hideBoss(){this.els.bossbar.classList.remove("on")}setCrosshair(t){this.crosshair.classList.toggle("hidden",!t)}setSpread(t){let e=this.root.querySelectorAll("#crosshair .ch");e.length&&(e[0].style.top=-t+"px",e[1].style.bottom=-t+"px",e[2].style.left=-t+"px",e[3].style.right=-t+"px")}};var l1=(a,t,e)=>{let i=document.createElement(a);return t&&(i.className=t),e!==void 0&&(i.innerHTML=e),i},ee=a=>String(a).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),c1=a=>'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="7"/><path d="M9.5 9.5 H14.5 M9.5 14.5 H14.5 M12 7 V17"/></svg>',Rd=[["inventory","Inventory"],["skills","Skills"],["journal","Journal"],["map","Map"],["craft","Craft"],["build","Build"],["medical","Medical"],["notes","Field Notes"]],Va=class{constructor(t,e){this.game=t,this.ui=e,this.screen=null,this.tab=null,this.craftCat="All",this.selected=null,this.hoverItem=null,this.drag=null,this.waypoint=null,this.build()}build(){this.overlay=l1("div","overlay"),this.overlay.id="screens",this.overlay.innerHTML='<div class="scr" id="scr-root"></div>',document.getElementById("ui").appendChild(this.overlay),this.root=this.overlay.querySelector("#scr-root"),this.overlay.addEventListener("click",t=>this.onClick(t)),this.overlay.addEventListener("contextmenu",t=>{t.preventDefault();let e=t.target.closest(".item");e&&this.rotateItem(+e.dataset.uid)}),this.overlay.addEventListener("mousedown",t=>this.onDown(t)),window.addEventListener("mousemove",t=>this.onMove(t)),window.addEventListener("mouseup",t=>this.onUp(t)),this.overlay.addEventListener("mousemove",t=>this.onHover(t)),this.overlay.addEventListener("mouseleave",()=>this.ui.hideTooltip()),window.addEventListener("keydown",t=>{this.screen&&((t.code==="Escape"||t.code==="Tab")&&(t.preventDefault(),this.close()),t.code==="KeyR"&&this.drag&&(this.drag.rot=!this.drag.rot))})}visible(){return!!this.screen}open(t,e=null){this.screen=t,this.tab=e||t,this.selected=null,this.overlay.classList.add("open"),this.ui.onPanelOpen(),this.render()}close(){this.screen=null,this.overlay.classList.remove("open"),this.ui.hideTooltip(),this.ui.onPanelClose()}swap(t){this.screen=t,this.tab=t,this.selected=null,this.render()}shell(t,e,i="",n=""){return`
      <div class="scr-head">
        <h1>${t}</h1>
        <div class="tabs">
          ${Rd.map(([s,r])=>`<div class="tab ${this.tab===s?"on":""}" data-act="tab" data-id="${s}">${r}</div>`).join("")}
          ${n}
        </div>
        <div class="close-x pe" data-act="close">${bi.close}</div>
      </div>
      <div class="scr-body">${e}</div>
      <div class="scr-foot">${i||"<span>ESC \u2014 CLOSE</span><span>[R] ROTATE ITEM \xB7 DRAG TO ARRANGE</span>"}</div>
    `}tabBar(){return Rd.map(([t,e])=>`<div class="tab ${this.tab===t?"on":""}" data-act="tab" data-id="${t}">${e}</div>`).join("")}render(){if(!this.screen)return;let t="";switch(this.screen){case"inventory":t=this.renderInventory();break;case"skills":t=this.renderSkills();break;case"journal":t=this.renderJournal();break;case"map":t=this.renderMap();break;case"craft":t=this.renderCraft();break;case"build":t=this.renderBuild();break;case"medical":t=this.renderMedical();break;case"notes":t=this.renderNotes();break;case"settings":t=this.renderSettings();break;default:t=this.renderInventory()}let e=this.root.querySelector(".scr-body")?.scrollTop||0;this.root.innerHTML=t,this.root.classList.add("fade-in"),setTimeout(()=>this.root.classList.remove("fade-in"),300);let i=this.root.querySelector(".scr-body");i&&e&&(i.scrollTop=e),this.screen==="map"&&this.drawMap(),this.screen==="inventory"&&this.renderDetail()}renderInventory(){let t=this.game.inventory,e=this.game.player,i=this.game,n=t.weight.toFixed(1),s=t.carryCapacity.toFixed(0),r=["head","body","back","light","utility","weapon1","weapon2","melee"],o={head:"Head",body:"Body",back:"Pack",light:"Light",utility:"Utility",weapon1:"Primary",weapon2:"Secondary",melee:"Melee"},l=r.map(m=>{let x=t.equipment[m],v=x?qe[x.id]||Me[x.id]:null;return`<div class="eq-slot ${x?"filled":""}" data-slot="${m}" data-act="eq" data-id="${m}" title="${x?ee(v?.name||x.id):o[m]}">
        ${x?vi(x.id,v,{size:30}):""}
        <span class="lbl">${o[m]}</span>
      </div>`}).join(""),c=Ba.map(m=>{let x=i.body?i.body.partCondition(m.id):100;return{...m,cond:x}}),h=m=>{let x=c.find(v=>v.id===m);return x?x.cond>66?"ok":x.cond>33?"hurt":"crit":""},d=[];for(let m=0;m<t.cols*t.rows;m++)d.push('<div class="inv-cell"></div>');let u=t.items.map(m=>{let x=qe[m.id]||Me[m.id],[v,b]=t.dims(m),_=m.durability!==void 0?Math.round(m.durability*100):null;return`<div class="item pe ${(x?.value||0)>=100?"rare":""} ${x?.cat==="quest"?"quest":""} ${this.selected===m.uid?"sel":""}"
        data-uid="${m.uid}" data-act="item"
        style="left:${m.x*10}%;top:${m.y*(100/t.rows)}%;width:${v*10}%;height:${b*(100/t.rows)}%">
        ${vi(m.id,x,{size:40})}
        ${m.qty>1?`<span class="qty">${m.qty}</span>`:""}
        ${_!==null&&x?.type?`<span class="dur"><i class="${_<30?"low":""}" style="width:${_}%"></i></span>`:""}
      </div>`}).join(""),f=Math.round(e.armorValue||0),g=Math.round((e.armorRadRes||0)*100),y=e.stats,p=`
      <div class="inv-wrap">
        <div class="equip-col">
          <div class="char-doll panel">
            ${ar(h)}
            <div class="eq-slots">${l}</div>
          </div>
          <div class="panel panel-pad">
            <div class="panel-title">Condition</div>
            <div class="stat-lines">
              <div class="stat-line"><span>Armor</span><b>${f}</b></div>
              <div class="stat-line"><span>Rad resist</span><b>${g}%</b></div>
              <div class="stat-line"><span>Health</span><b class="${y.health<35?"warn":""}">${Math.round(y.health)} / ${y.healthMax}</b></div>
              <div class="stat-line"><span>Bleeding</span><b class="${y.bleed>1?"warn":""}">${Math.round(y.bleed)}%</b></div>
              <div class="stat-line"><span>Infection</span><b class="${y.infection>20?"warn":""}">${Math.round(y.infection)}%</b></div>
              <div class="stat-line"><span>Radiation</span><b class="${y.radiation>20?"warn":""}">${Math.round(y.radiation)}</b></div>
            </div>
          </div>
        </div>
        <div class="grid-col">
          <div class="grid-head">
            <div class="panel-title" style="margin:0">Field Pack \xB7 ${t.cols}\xD7${t.rows}</div>
            <div class="carry ${t.overloaded?"over":""}">CARRY <b>${n}</b> / ${s} kg</div>
          </div>
          <div class="inv-grid ${t.overloaded?"over":""}" id="inv-grid">${d.join("")}${u}</div>
          <div class="inv-foot">
            <div style="display:flex;gap:6px">
              <button class="btn sm pe" data-act="sort">${bi.sort} Sort</button>
              <button class="btn sm pe" data-act="drop-sel">${bi.drop} Drop</button>
            </div>
            <div class="gold">${c1}<b>${t.gold}</b></div>
          </div>
        </div>
        <div class="detail-col panel panel-pad" id="inv-detail"></div>
      </div>
    `;return this.shell("Inventory",p)}itemDef(t){return qe[t]||Me[t]}renderDetail(){let t=this.root.querySelector("#inv-detail");if(!t)return;let e=this.game.inventory,i=this.selected?e.items.find(c=>c.uid===this.selected):null;if(!i){t.innerHTML=`<div class="panel-title">Item</div><div class="detail-empty">Select an item<br>in the pack</div>
        <div class="hr"></div><div class="d-hint">Drag items to rearrange.<br>Right click to rotate.<br>Double click to use or equip.</div>`;return}let n=this.itemDef(i.id),s=!!Me[i.id],r=[];if(n.dmg&&r.push(["Damage",n.dmg+(n.pellets?` \xD7${n.pellets}`:"")]),n.rate&&r.push(["Cycle",n.rate.toFixed(1)+" /s"]),n.mag&&r.push(["Magazine",n.mag]),n.range&&r.push(["Range",n.range+" m"]),n.armor&&r.push(["Armor",n.armor]),n.radResist&&r.push(["Rad resist",Math.round(n.radResist*100)+"%"]),n.carry&&r.push(["Carry bonus","+"+n.carry+" kg"]),n.use)for(let[c,h]of Object.entries(n.use))r.push([c,(h>0?"+":"")+h]);r.push(["Weight",(n.weight||0).toFixed(2)+" kg"]),r.push(["Value",n.value||0]);let o=[];s?o.push(`<button class="btn sm pe" data-act="equip-sel">${bi.equip} Equip</button>`):n.slot&&o.push(`<button class="btn sm pe" data-act="equip-sel">${bi.equip} Equip</button>`),(n.use||n.cat==="food"||n.cat==="water"||n.cat==="medicine")&&o.push(`<button class="btn sm pe" data-act="use-sel">${bi.use} Use</button>`),o.push(`<button class="btn sm pe" data-act="drop-sel">${bi.drop} Drop</button>`);let l="";if(s&&n.attachments){let c=i.attachments||{};l='<div class="panel-title" style="margin-top:16px">Attachments</div>';for(let h of n.attachments){let d=c[h];l+=`<div class="att-row"><span>${ee(h.replace(/_/g," "))}</span><b>${d?ee(qe[d?.id]?.name||"Fitted"):"\u2014"}</b></div>`}}t.innerHTML=`
      <div class="panel-title">Item Detail</div>
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div class="r-icon" style="width:56px;height:56px">${vi(i.id,n,{size:42})}</div>
        <div style="flex:1">
          <div class="d-title">${ee(n?.name||i.id)}</div>
          <div class="d-cat">${ee((n?.cat||n?.type||"item").toUpperCase())}${i.qty>1?" \xB7 \xD7"+i.qty:""}</div>
        </div>
      </div>
      <div class="d-desc">${ee(n?.desc||"No description on file.")}</div>
      <div class="d-stats">
        ${r.map(([c,h])=>`<div class="d-stat"><span>${ee(c)}</span><b>${ee(h)}</b></div>`).join("")}
        ${i.durability!==void 0&&s?`<div class="d-stat"><span>Condition</span><b>${Math.round(i.durability*100)}%</b></div>`:""}
      </div>
      ${l}
      <div class="d-actions">${o.join("")}</div>
      <div class="d-hint">${s?"Weapons lose condition as they fire. Repair at a workbench.":"Drag to arrange. Right click rotates."}</div>
    `}rotateItem(t){let e=this.game.inventory,i=e.items.find(r=>r.uid===t);if(!i)return;let[n,s]=e.dims(i);n!==s&&e.moveItem(t,i.x,i.y,!i.rot)&&(this.game.audio.uiClick(),this.render())}renderSkills(){let t=this.game,e=t.skillPoints||0,i=Object.entries(Vs).map(([s,r])=>{let o=r.nodes.reduce((c,h)=>c+(t.skillRanks[h.id]||0),0),l=r.nodes.map(c=>{let h=t.skillRanks[c.id]||0,d=h>=c.max,u=c.req.every(p=>(t.skillRanks[p]||0)>0),f=!d&&u&&e>0,g=d?"maxed":u?f?"can":"":"locked",y=Array.from({length:c.max},(p,m)=>`<i class="${m<h?"on":""}"></i>`).join("");return`<div class="sk ${g} pe" data-act="skill" data-id="${c.id}" title="${ee(c.desc)}">
          <div class="sk-icon">${h}/${c.max}</div>
          <div class="sk-main">
            <div class="sk-name">${ee(c.name)}</div>
            <div class="sk-desc">${ee(c.desc)}</div>
            <div class="sk-meta"><span>${d?"MASTERED":u?"1 POINT":"REQUIRES "+c.req.join(", ").toUpperCase()}</span>
              <span class="sk-pips">${y}</span></div>
          </div>
        </div>`}).join("");return`<div class="tree">
        <div class="tree-head">
          <h3 style="color:${r.color}">${ee(r.name)}</h3>
          <div class="t-desc">${this.treeDesc(s)}</div>
          <div class="t-count">${o}</div>
        </div>
        <div class="tree-body">${l}</div>
      </div>`}).join(""),n=`<div style="flex:1;display:flex;flex-direction:column;min-height:0;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="panel-title" style="margin:0">Four disciplines \xB7 50 levels \xB7 1 point per level</div>
        <div class="skill-points">Available points <b>${e}</b></div>
      </div>
      <div class="skill-trees">${i}</div>
    </div>`;return this.shell("Skills",n,"<span>CLICK A NODE TO SPEND A POINT</span><span>LEVEL 50 CAP</span>")}treeDesc(t){return{combat:"Weapon handling, recoil control, melee. Built to end fights.",survival:"Endurance, medicine, tolerance for hunger, cold and pain.",engineering:"Salvage, repair, ammunition, construction.",exploration:"Awareness, silence, endurance running, finding what others missed."}[t]||""}renderJournal(){let t=this.game.quests,e=new Set(Object.entries(t.state).filter(([,c])=>c.status==="active").map(([c])=>c)),i=new Set(Object.entries(t.state).filter(([,c])=>c.status==="done").map(([c])=>c)),n=bd.map(c=>{let h=bs.filter(u=>u.act===c.n),d=h.filter(u=>i.has(u.id)).length;return`<div class="act ${this.actSel===c.n?"on":""}" data-act="act" data-id="${c.n}">
        <div class="a-num">ACT ${c.n}</div>
        <div class="a-name">${ee(c.name)}</div>
        <div class="a-sub">${d} / ${h.length} complete</div>
      </div>`}).join("")+`<div class="act ${this.actSel==="side"?"on":""}" data-act="act" data-id="side">
        <div class="a-num">OPTIONAL</div><div class="a-name">Side Work</div>
        <div class="a-sub">${t.quests.filter(c=>!c.act).length} tasks</div></div>`,s=[];this.actSel==="side"?s=t.quests.filter(c=>!c.act):this.actSel?s=bs.filter(c=>c.act===this.actSel):(s=t.quests.filter(c=>e.has(c.id)||t.canStart(c.id)).slice(0,20),s.length||(s=bs.slice(0,3)));let r=s.map(c=>{let h=t.state[c.id],d=h?.status||(t.canStart(c.id)?"available":"locked"),u=c.objectives.map((m,x)=>{let v=h?.progress?.[x]||0,b=m.count||1;return`<div class="${v>=b?"done":""}">${ee(m.desc||m.type)}${b>1?` <span class="obj-count">${v}/${b}</span>`:""}</div>`}).join(""),f=c.rewards||{},g=[f.xp?f.xp+" XP":"",f.money?f.money+" trade":"",...Object.entries(f.items||{}).map(([m,x])=>`${this.itemDef(m)?.name||m} \xD7${x}`)].filter(Boolean).join(" \xB7 "),y=c.act?'<span class="q-tag main">MAIN</span>':'<span class="q-tag">SIDE</span>',p=d==="done"?'<span class="q-tag done">COMPLETE</span>':"";return`<div class="q-card ${this.selected===c.id?"on":""} ${d==="done"?"done":""}" data-act="quest" data-id="${c.id}">
        <div class="q-num">${c.act?"ACT "+c.act:"SIDE TASK"}${y}${p}</div>
        <div class="q-name">${ee(c.name)}</div>
        <div class="q-short">${ee(c.desc)}</div>
        <div class="q-obj">${u}</div>
        ${g?`<div class="q-reward">REWARD <b>${ee(g)}</b></div>`:""}
        ${d==="active"&&t.tracked!==c.id?`<div style="margin-top:8px"><button class="btn sm pe" data-act="track" data-id="${c.id}">Track</button></div>`:""}
        ${d==="active"&&t.tracked===c.id?'<div style="margin-top:8px" class="tiny">TRACKED</div>':""}
      </div>`}).join(""),o=`<div class="journal-wrap">
      <div class="act-list">${n}</div>
      <div class="quest-list">${s.length?r:'<div class="empty-state">No tasks recorded</div>'}</div>
    </div>`,l=`<span>${t.completedCount} OBJECTIVES COMPLETED</span><span>${e.size} ACTIVE</span>`;return this.shell("Journal",o,l)}renderNotes(){let t=this.game,e=t.codex?.mutants||{},i=t.codex?.kills||{},n=Object.entries(Ti).map(([l,c])=>{let h=!!e[l];return`<div class="q-card">
        <div class="q-num">${h?"LOGGED":"UNCONFIRMED"}</div>
        <div class="q-name">${h?ee(c.name):"UNKNOWN ORGANISM"}</div>
        <div class="q-short">${h?ee(c.desc):"No observation recorded. Something is out there."}</div>
        ${h?`<div class="q-obj"><div>THREAT ${c.threat} \xB7 ${ee(c.tactics)}</div>
          <div>KILLED ${i[l]||0}</div></div>`:""}
      </div>`}).join(""),s=Object.entries(zn).map(([l,c])=>{let h=t.codex?.bosses?.[l];return`<div class="q-card ${h?"done":""}">
        <div class="q-num">${h?"TERMINATED":"HOSTILE \xB7 UNENGAGED"}</div>
        <div class="q-name">${h||t.codex?.bossSeen?.[l]?ee(c.name):"REDACTED"}</div>
        <div class="q-short">${h||t.codex?.bossSeen?.[l]?ee(c.desc):"Warden records sealed."}</div>
      </div>`}).join(""),r=hi.map(l=>{let c=t.codex?.regions?.[l.id];return`<div class="q-card ${c?"":"done"}">
        <div class="q-num">${c?"SURVEYED":"UNEXPLORED"} \xB7 DANGER ${l.danger}</div>
        <div class="q-name">${ee(l.name)}</div>
        <div class="q-short">${c?ee(l.desc):"No survey data. The map ends here."}</div>
      </div>`}).join(""),o=`<div style="flex:1;display:flex;flex-direction:column;gap:12px;min-height:0">
      <div class="tabs" style="gap:2px">
        <div class="tab ${this.notesTab!=="mutants"?"":"on"}" data-act="notes-tab" data-id="mutants">Organisms</div>
        <div class="tab ${this.notesTab==="bosses"?"on":""}" data-act="notes-tab" data-id="bosses">Warden Assets</div>
        <div class="tab ${this.notesTab==="regions"?"on":""}" data-act="notes-tab" data-id="regions">Regions</div>
      </div>
      <div class="craft-wrap">${this.notesTab==="bosses"?s:this.notesTab==="regions"?r:n}</div>
    </div>`;return this.shell("Field Notes",o,`<span>${Object.keys(e).length} ORGANISMS LOGGED</span><span>AUTO-RECORDED</span>`)}renderMap(){let t=this.game,e=t.world.pois.filter(r=>r.discovered),i=t.player,n=e.map(r=>{let o=Math.hypot(r.x-i.pos.x,r.z-i.pos.z);return`<div class="poi-row" data-act="poi" data-id="${r.id}">
        <span class="p-name">${ee(r.name)}</span><span class="p-dist">${Math.round(o)}m</span></div>`}).join(""),s=`<div class="map-wrap">
      <div id="map-canvas-wrap"><canvas id="map-canvas"></canvas>
        <div class="map-legend">
          <div><i style="background:#8fa36a"></i>Discovered site</div>
          <div><i style="background:#b04632"></i>Warden asset</div>
          <div><i style="background:#c9963f"></i>Camp / safe</div>
          <div><i style="background:#79a0b4"></i>Water</div>
          <div class="mono" style="opacity:.55;margin-top:2px">Contours every 8 m</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;min-height:0">
        <div class="panel-title" style="margin:0">Located Sites \xB7 ${e.length}/${t.world.pois.length}</div>
        <div class="poi-list" style="flex:1">${n||'<div class="empty-state">No sites surveyed</div>'}</div>
        <div class="panel panel-pad" style="font-size:10.5px;color:var(--dim);line-height:1.6">
          <div>CLICK THE MAP TO SET A WAYPOINT</div>
          <div class="mono" style="margin-top:6px;color:var(--paper-2)" id="map-coords">\u2014</div>
        </div>
      </div>
    </div>`;return this.shell("Map",s,"<span>CLICK TO MARK \xB7 WAYPOINT SHOWS ON COMPASS</span><span>ESC \u2014 CLOSE</span>")}drawMap(){let t=this.root.querySelector("#map-canvas");if(!t)return;let e=t.parentElement,i=Math.min(window.devicePixelRatio||1,2),n=e.clientWidth,s=e.clientHeight;if(n<10||s<10)return;t.width=n*i,t.height=s*i;let r=t.getContext("2d");if(!r)return;r.scale(i,i);let o=this.game,l=-720,c=720,h=-540,d=560,u=b=>(b-l)/(c-l)*n,f=b=>(b-h)/(d-h)*s;this.mapTransform={sx:u,sz:f,W:n,H:s},r.fillStyle="#0d100c",r.fillRect(0,0,n,s);let g=o.world.mapBitmap;if(g){if(!this._mapChart||this._mapChart.bm!==g){let _=document.createElement("canvas");_.width=g.w,_.height=g.h;let A=_.getContext("2d"),T=A.createImageData(g.w,g.h);T.data.set(g.data),A.putImageData(T,0,0),this._mapChart={bm:g,canvas:_}}r.save(),r.globalAlpha=.92,r.imageSmoothingEnabled=!0,r.drawImage(this._mapChart.canvas,0,0,n,s),r.restore(),r.strokeStyle="rgba(12,16,12,.30)";for(let _=l;_<=c;_+=100)r.beginPath(),r.moveTo(u(_),0),r.lineTo(u(_),s),r.stroke();for(let _=h;_<=d;_+=100)r.beginPath(),r.moveTo(0,f(_)),r.lineTo(n,f(_)),r.stroke();let b=r.createRadialGradient(n*.5,s*.5,s*.25,n*.5,s*.5,s*.95);b.addColorStop(0,"rgba(8,10,8,0)"),b.addColorStop(1,"rgba(8,10,8,.55)"),r.fillStyle=b,r.fillRect(0,0,n,s)}for(let b of hi){let _=u(Math.max(b.x0,l)),A=u(Math.min(b.x1,c)),T=f(Math.max(b.z0,h)),k=f(Math.min(b.z1,d));r.strokeStyle="rgba(170,176,150,.14)",r.strokeRect(_,T,A-_,k-T),r.fillStyle="rgba(190,196,168,.44)",r.font='9px "SFMono-Regular",Consolas,monospace',r.fillText(b.name,_+8,T+14)}let y=o.world,p=y.terrain?.crater;p&&(r.beginPath(),r.arc(u(p.x),f(p.z),Math.max(4,p.r/(c-l)*n),0,Math.PI*2),r.strokeStyle="rgba(180,80,60,.5)",r.stroke(),r.fillStyle="rgba(120,50,40,.12)",r.fill());let m=y.terrain?.lake;if(m&&(r.beginPath(),r.arc(u(m.x),f(m.z),Math.max(3,m.r/(c-l)*n),0,Math.PI*2),r.fillStyle="rgba(110,150,170,.18)",r.fill()),r.strokeStyle="rgba(120,120,100,.18)",r.lineWidth=1,y.terrain?.roadSegments)for(let b of y.terrain.roadSegments)r.beginPath(),r.moveTo(u(b.a[0]),f(b.a[1])),r.lineTo(u(b.b[0]),f(b.b[1])),r.stroke();for(let b of y.pois){let _=u(b.x),A=f(b.z),T=b.discovered,k=b.type==="boss",D=b.type==="camp"||b.type==="shelter";if(k&&!T){r.fillStyle="rgba(176,70,50,.35)",r.beginPath(),r.arc(_,A,3,0,Math.PI*2),r.fill();continue}T&&(r.fillStyle=k?"#b04632":D?"#c9963f":"#8fa36a",r.save(),r.translate(_,A),r.rotate(Math.PI/4),r.fillRect(-3,-3,6,6),r.restore(),r.fillStyle="rgba(200,195,178,.55)",r.font='9px "Barlow Condensed",Arial',r.fillText(b.name,_+7,A+3))}if(this.waypoint){let b=u(this.waypoint.x),_=f(this.waypoint.z);r.strokeStyle="#e0b463",r.lineWidth=1.5,r.beginPath(),r.arc(b,_,7,0,Math.PI*2),r.stroke(),r.beginPath(),r.moveTo(b-10,_),r.lineTo(b+10,_),r.moveTo(b,_-10),r.lineTo(b,_+10),r.stroke()}let x=u(o.player.pos.x),v=f(o.player.pos.z);r.save(),r.translate(x,v),r.rotate(-o.player.yaw),r.fillStyle="#f0e6cc",r.beginPath(),r.moveTo(0,-7),r.lineTo(5,6),r.lineTo(0,3),r.lineTo(-5,6),r.closePath(),r.fill(),r.restore(),r.strokeStyle="rgba(240,230,204,.35)",r.beginPath(),r.arc(x,v,16,0,Math.PI*2),r.stroke(),t.onmousedown=b=>{let _=t.getBoundingClientRect(),A=b.clientX-_.left,T=b.clientY-_.top,k=l+A/n*(c-l),D=h+T/s*(d-h);this.waypoint={x:k,z:D},this.game.setWaypoint(k,D);let w=this.root.querySelector("#map-coords");w&&(w.textContent=`WAYPOINT  X ${Math.round(k)}  Z ${Math.round(D)}`),this.drawMap()}}renderCraft(){let t=this.game,e=["All",...new Set(xs.map(o=>o.cat))],i=t.nearBenchLevel??0,s=xs.filter(o=>this.craftCat==="All"||o.cat===this.craftCat).map(o=>{let[l,c]=o.out,h=this.itemDef(l),d=t.skills?.craftCheap||0,u=Object.entries(o.in).map(([y,p])=>{let m=Math.max(1,p-(_=>0)(0)),x=t.inventory.count(y),v=Math.max(1,p-(d>0&&(o.cat==="Weapons"||o.cat==="Ammunition")?1:0));return`<span class="ing ${x>=v?"":"miss"}">${ee(this.itemDef(y)?.name||y)} ${x}/${v}</span>`}).join(""),f=i>=o.bench,g=f&&Object.entries(o.in).every(([y,p])=>{let m=Math.max(1,p-(d>0&&(o.cat==="Weapons"||o.cat==="Ammunition")?1:0));return t.inventory.count(y)>=m});return`<div class="recipe ${g?"":"cant"}">
        <div class="r-head">
          <div class="r-icon">${vi(l,h,{size:26})}</div>
          <div style="flex:1">
            <div class="r-name">${ee(h?.name||l)}${c>1?` \xD7${c}`:""}</div>
            <div class="r-sub">${ee(o.cat)} \xB7 ${o.bench===0?"HAND TOOLS":o.bench===1?"WORKBENCH":"MACHINE SHOP"}</div>
          </div>
        </div>
        <div class="r-desc">${ee(h?.desc||"")}</div>
        <div class="r-ing">${u}</div>
        <div class="r-foot">
          <span class="r-time">${o.time}s</span>
          <button class="btn sm pe" data-act="craft" data-id="${o.id}" ${g?"":"disabled"}>${g?"Craft":f?"Missing materials":"Bench required"}</button>
        </div>
      </div>`}).join(""),r=`<div style="flex:1;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="tab-bar">${e.map(o=>`<div class="tab ${this.craftCat===o?"on":""}" data-act="craft-cat" data-id="${o}">${ee(o)}</div>`).join("")}</div>
        <div class="tiny">BENCH LEVEL ${i} ${i?"":" \xB7 NONE NEARBY"}</div>
      </div>
      <div class="craft-wrap">${s}</div>
    </div>`;return this.shell("Crafting",r,`<span>${xs.length} RECIPES KNOWN</span><span>MATERIALS PULLED FROM PACK</span>`)}renderBuild(){let t=this.game,e=Gs.map(n=>{let s=Object.entries(n.cost).map(([o,l])=>{let c=t.inventory.count(o);return`<span class="ing ${c>=l?"":"miss"}">${ee(this.itemDef(o)?.name||o)} ${c}/${l}</span>`}).join(""),r=Object.entries(n.cost).every(([o,l])=>t.inventory.count(o)>=l);return`<div class="recipe ${r?"":"cant"}">
        <div class="r-head">
          <div class="r-icon">${vi("wood_plank",qe.wood_plank,{size:26,color:"#a08a5a"})}</div>
          <div style="flex:1">
            <div class="r-name">${ee(n.name)}</div>
            <div class="r-sub">${ee(n.cat)} \xB7 ${n.size[0]}\xD7${n.size[1]}\xD7${n.size[2]} m</div>
          </div>
        </div>
        <div class="r-desc">${n.storage?`Storage capacity ${n.storage} slots.`:n.bench?"Enables advanced crafting recipes.":n.light?"Provides light and warmth.":n.damage?`Deals ${n.damage} damage when stepped on.`:"Structural piece for a forward base."}</div>
        <div class="r-ing">${s}</div>
        <div class="r-foot">
          <span class="r-time">HP ${n.hp}</span>
          <button class="btn sm pe" data-act="place" data-id="${n.id}" ${r?"":"disabled"}>${r?"Place":"Missing materials"}</button>
        </div>
      </div>`}).join(""),i=`<div style="flex:1;display:flex;flex-direction:column;min-height:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-title" style="margin:0">Forward Construction \xB7 ${t.buildCount||0} structures standing</div>
        <div class="tiny">CLICK PLACE, THEN LEFT CLICK IN THE WORLD</div>
      </div>
      <div class="craft-wrap">${e}</div>
    </div>`;return this.shell("Base Building",i,"<span>SNAP TO GROUND</span><span>STORAGE SHARED WITH PACK</span>")}renderMedical(){let t=this.game,e=t.body,i=t.inventory,n=Ba.map(l=>{let c=e?e.partCondition(l.id):100,h=e?.wounds[l.id]||{bleed:0,fracture:!1,infection:0},d=c>66?"":c>33?"mid":"bad",u=[];return h.bleed>1&&u.push(`<span class="med-tag">Bleeding ${Math.round(h.bleed)}</span>`),h.fracture&&u.push('<span class="med-tag">Fractured</span>'),h.infection>1&&u.push(`<span class="med-tag">Infected ${Math.round(h.infection)}</span>`),u.length||u.push('<span class="med-tag ok">Stable</span>'),`<div class="med-part ${c<34?"crit":""}">
        <div class="med-part-head"><span class="med-part-name">${l.label}</span><span class="med-part-val">${Math.round(c)}%</span></div>
        <div class="med-bar"><i class="${d}" style="width:${c}%"></i></div>
        <div class="med-tags">${u.join("")}</div>
        <div class="med-actions">
          <button class="btn sm pe" data-act="treat" data-id="${l.id}" data-item="bandage" ${i.count("bandage")?"":"disabled"}>Bandage</button>
          <button class="btn sm pe" data-act="treat" data-id="${l.id}" data-item="splint" ${i.count("splint")?"":"disabled"}>Splint</button>
          <button class="btn sm pe" data-act="treat" data-id="${l.id}" data-item="medkit" ${i.count("medkit")?"":"disabled"}>Medkit</button>
        </div>
      </div>`}).join(""),s=t.player.stats,o=`<div class="scr-body" style="gap:24px">
      <div class="med-doll panel" style="min-width:300px">${ar(l=>{let c=e?e.partCondition(l):100;return c>66?"ok":c>33?"hurt":"crit"})}</div>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px;min-height:0">
        <div class="panel panel-pad">
          <div class="panel-title" style="margin:0">Systemic condition</div>
          <div class="status-strip" style="margin-top:10px">
            <div class="stat-chip ${s.bleed>1?"warn":""}">${On.bleed}<b>Bleed ${Math.round(s.bleed)}</b></div>
            <div class="stat-chip ${s.infection>20?"warn":""}">${On.infection}<b>Infection ${Math.round(s.infection)}</b></div>
            <div class="stat-chip ${s.radiation>25?"warn":""}">${On.radiation}<b>Radiation ${Math.round(s.radiation)}</b></div>
            <div class="stat-chip">${On.health}<b>${Math.round(s.health)} / ${s.healthMax} HP</b></div>
          </div>
          <div class="med-actions" style="margin-top:12px">
            <button class="btn sm pe" data-act="treat" data-id="torso" data-item="antibiotics" ${i.count("antibiotics")?"":"disabled"}>Antibiotics</button>
            <button class="btn sm pe" data-act="treat" data-id="torso" data-item="antirad" ${i.count("antirad")?"":"disabled"}>Anti-rad</button>
            <button class="btn sm pe" data-act="treat" data-id="torso" data-item="painkillers" ${i.count("painkillers")?"":"disabled"}>Painkillers</button>
            <button class="btn sm pe" data-act="treat" data-id="torso" data-item="stim_combat" ${i.count("stim_combat")?"":"disabled"}>Combat stim</button>
          </div>
        </div>
        <div class="med-parts" style="flex:1">${n}</div>
      </div>
    </div>`;return`<div class="scr-head"><h1>Medical</h1><div class="tabs">${this.tabBar()}</div>
      <div class="close-x pe" data-act="close">${bi.close}</div></div>
      ${o}
      <div class="scr-foot"><span>TREATMENTS CONSUME SUPPLIES</span><span>CRIPPLED LIMBS AFFECT MOVEMENT AND AIM</span></div>`}renderSettings(){let t=this.game.settings,e=(s,r,o,l,c,h,d=u=>u)=>`
      <div class="set-row"><div class="set-label">${r}</div>
        <div class="set-ctl"><input type="range" class="pe" data-act="set" data-key="${s}" min="${o}" max="${l}" step="${c}" value="${h}">
        <span class="set-val">${d(h)}</span></div></div>`,i=(s,r,o,l)=>`
      <div class="set-row"><div class="set-label">${r}</div>
        <div class="set-ctl"><div class="seg">${o.map(c=>`<button class="pe ${String(l)===String(c[0])?"on":""}" data-act="setseg" data-key="${s}" data-val="${c[0]}">${c[1]}</button>`).join("")}</div></div></div>`,n=`<div class="settings-wrap">
      <div class="set-group">
        <div class="panel-title">Audio</div>
        ${e("master","Master volume",0,1,.05,t.master,s=>Math.round(s*100)+"%")}
        ${e("music","Music",0,1,.05,t.music,s=>Math.round(s*100)+"%")}
        ${e("sfx","Effects",0,1,.05,t.sfx,s=>Math.round(s*100)+"%")}
        <div class="hr"></div>
        <div class="panel-title">Video</div>
        ${e("fov","Field of view",60,100,1,t.fov,s=>s+"\xB0")}
        ${e("renderScale","Render scale",.5,1,.05,t.renderScale,s=>Math.round(s*100)+"%")}
        ${e("brightness","Brightness",.6,1.6,.05,t.brightness,s=>s.toFixed(2))}
        ${e("viewDistance","View distance",.5,1.4,.1,t.viewDistance,s=>Math.round(s*100)+"%")}
        ${i("shadows","Shadows",[[1,"On"],[0,"Off"]],t.shadows?1:0)}
        ${i("quality","Quality",[["low","Low"],["medium","Medium"],["high","High"]],t.quality)}
        ${i("motionBlur","Motion blur",[[1,"On"],[0,"Off"]],t.motionBlur?1:0)}
      </div>
      <div class="set-group">
        <div class="panel-title">Gameplay</div>
        ${e("sensitivity","Mouse sensitivity",.2,3,.05,t.sensitivity,s=>s.toFixed(2))}
        ${e("gamepadSens","Gamepad sensitivity",.2,3,.05,t.gamepadSens,s=>s.toFixed(2))}
        ${i("invertY","Invert Y",[[0,"Off"],[1,"On"]],t.invertY?1:0)}
        ${i("difficulty","Difficulty",[["story","Story"],["survivor","Survivor"],["ashes","Ashes"]],t.difficulty)}
        ${i("cameraMode","Default view",[[0,"Third"],[1,"First"]],t.cameraMode)}
        ${i("autoPickup","Auto pickup ammo",[[1,"On"],[0,"Off"]],t.autoPickup?1:0)}
        ${i("showDamage","Damage numbers",[[1,"On"],[0,"Off"]],t.showDamage?1:0)}
        <div class="hr"></div>
        <div class="panel-title">Controls</div>
        <div class="keys-grid">
          <div class="key-row"><span>Move</span><kbd>W A S D</kbd></div>
          <div class="key-row"><span>Sprint</span><kbd>SHIFT</kbd></div>
          <div class="key-row"><span>Crouch</span><kbd>C</kbd></div>
          <div class="key-row"><span>Jump / Vault</span><kbd>SPACE</kbd></div>
          <div class="key-row"><span>Fire</span><kbd>LMB</kbd></div>
          <div class="key-row"><span>Aim</span><kbd>RMB</kbd></div>
          <div class="key-row"><span>Reload</span><kbd>R</kbd></div>
          <div class="key-row"><span>Interact</span><kbd>E</kbd></div>
          <div class="key-row"><span>Flashlight</span><kbd>F</kbd></div>
          <div class="key-row"><span>Medical</span><kbd>H</kbd></div>
          <div class="key-row"><span>Inventory</span><kbd>TAB</kbd></div>
          <div class="key-row"><span>Journal</span><kbd>J</kbd></div>
          <div class="key-row"><span>Map</span><kbd>M</kbd></div>
          <div class="key-row"><span>Skills</span><kbd>K</kbd></div>
          <div class="key-row"><span>Crafting</span><kbd>C</kbd></div>
          <div class="key-row"><span>Camera</span><kbd>V</kbd></div>
          <div class="key-row"><span>Quick slot</span><kbd>1 2 3 4</kbd></div>
          <div class="key-row"><span>Pause</span><kbd>ESC</kbd></div>
        </div>
      </div>
    </div>`;return`<div class="scr-head"><h1>Settings</h1>
      <div class="tabs">${this.tabBar()}</div>
      <div class="close-x pe" data-act="close">${bi.close}</div></div>
      <div class="scr-body">${n}</div>
      <div class="scr-foot"><span>CHANGES APPLY IMMEDIATELY</span><span>ESC \u2014 BACK</span></div>`}onClick(t){let e=t.target.closest("[data-act]"),i=this.game;if(!e)return t.target.closest(".item"),void 0;let n=e.dataset.act,s=e.dataset.id;if(n==="close")return this.close();if(n==="tab"){let r=s==="notes"&&this.screen==="notes"?"notes":s;r==="settings"||r==="medical"?(this.screen=r,this.tab=r):(this.screen=r,this.tab=r),this.selected=null,this.render();return}if(n==="act"){this.actSel=s==="side"?"side":+s,this.render();return}if(n==="quest"){this.selected=s,this.render();return}if(n==="track"){i.quests.tracked=s,i.audio.uiClick(),this.render();return}if(n==="notes-tab"){this.notesTab=s,this.render();return}if(n==="craft-cat"){this.craftCat=s,this.render();return}if(n==="sort"){i.inventory.sortItems(),i.audio.uiClick(),this.render();return}if(n==="craft"){i.craft(s),this.render();return}if(n==="place"){i.startBuilding(s),this.close();return}if(n==="item"){let r=+e.dataset.uid;this.selected=r,i.audio.uiClick(),this.refreshAll();return}if(n==="eq"){let r=s,o=i.inventory;o.equipment[r]&&(o.unequip(r),i.audio.uiClick(),this.refreshAll());return}if(n==="use-sel"){this.selected&&(i.inventory.useItem(this.selected),this.selected=null,this.refreshAll());return}if(n==="equip-sel"){this.selected&&(i.inventory.equip(this.selected)&&(this.selected=null,i.audio.equip&&i.audio.equip()),this.refreshAll());return}if(n==="drop-sel"){this.selected&&(i.dropItem(this.selected),this.selected=null,this.refreshAll());return}if(n==="skill"){i.spendSkillPoint(s),this.render();return}if(n==="treat"){let r=s,o=e.dataset.item;i.body&&i.body.treat(r,o),this.render();return}if(n==="poi"){let r=i.world.pois.find(o=>o.id===s);r&&(this.waypoint={x:r.x,z:r.z},i.setWaypoint(r.x,r.z),this.drawMap());return}if(n==="set"||n==="setseg"){let r=e.dataset.key,o=n==="set"?parseFloat(e.value):e.dataset.val;if(["shadows","invertY","motionBlur","autoPickup","showDamage"].includes(r)&&(o=+o),(r==="quality"||r==="difficulty")&&(o=String(o)),r==="cameraMode"&&(o=+o),i.settings[r]=o,i.applySettings(),n==="set"){let l=e.parentElement.querySelector(".set-val");if(l){let c={fov:h=>h+"\xB0",renderScale:h=>Math.round(h*100)+"%",brightness:h=>(+h).toFixed(2),viewDistance:h=>Math.round(h*100)+"%",master:h=>Math.round(h*100)+"%",music:h=>Math.round(h*100)+"%",sfx:h=>Math.round(h*100)+"%",sensitivity:h=>(+h).toFixed(2),gamepadSens:h=>(+h).toFixed(2)}[r]||(h=>h);l.textContent=c(o)}}else this.render();return}}refreshAll(){if(this.screen){if(this.screen==="inventory"){let t=this.root.querySelector("#inv-grid");if(t){let e=this.game.inventory;for(let s of t.querySelectorAll(".item"))s.remove();t.insertAdjacentHTML("beforeend",e.items.map(s=>{let r=this.itemDef(s.id),[o,l]=e.dims(s),c=s.durability!==void 0?Math.round(s.durability*100):null;return`<div class="item pe ${(r?.value||0)>=100?"rare":""} ${r?.cat==="quest"?"quest":""} ${this.selected===s.uid?"sel":""}"
            data-uid="${s.uid}" data-act="item"
            style="left:${s.x*10}%;top:${s.y*(100/e.rows)}%;width:${o*10}%;height:${l*(100/e.rows)}%">
            ${vi(s.id,r,{size:40})}
            ${s.qty>1?`<span class="qty">${s.qty}</span>`:""}
            ${c!==null&&r?.type?`<span class="dur"><i class="${c<30?"low":""}" style="width:${c}%"></i></span>`:""}
          </div>`}).join(""));let i=this.root.querySelector(".carry");i&&(i.innerHTML=`CARRY <b>${e.weight.toFixed(1)}</b> / ${e.carryCapacity.toFixed(0)} kg`);let n=this.root.querySelectorAll(".eq-slot");for(let s of n){let r=s.dataset.slot,o=e.equipment[r],l=o?this.itemDef(o.id):null;s.classList.toggle("filled",!!o),s.innerHTML=`${o?vi(o.id,l,{size:30}):""}<span class="lbl">${r==="weapon1"?"Primary":r==="weapon2"?"Secondary":r[0].toUpperCase()+r.slice(1)}</span>`}}this.renderDetail();return}this.render()}}onDown(t){if(!this.screen)return;let e=t.target.closest(".item");if(!e||t.button!==0)return;let i=+e.dataset.uid,s=this.game.inventory.items.find(o=>o.uid===i);if(!s)return;let r=e.getBoundingClientRect();this.drag={uid:i,item:s,offX:t.clientX-r.left,offY:t.clientY-r.top,ghostW:r.width,ghostH:r.height,rot:s.rot,moved:!1,startX:t.clientX,startY:t.clientY},this.selected=i,e.classList.add("dragging"),t.preventDefault()}onMove(t){if(!this.drag)return;this.drag.moved=this.drag.moved||Math.abs(t.clientX-this.drag.startX)+Math.abs(t.clientY-this.drag.startY)>4;let e=this.root.querySelector("#inv-grid");if(!e)return;let i=this.gridCoord(t.clientX,t.clientY);for(let n of e.querySelectorAll(".inv-cell.hover, .inv-cell.bad"))n.classList.remove("hover","bad");if(i){let n=this.game.inventory,s=this.drag.item,[r,o]=n.dims({...s,rot:this.drag.rot}),l=n.canPlace(s,i.x,i.y,this.drag.rot),c=e.querySelectorAll(".inv-cell");for(let h=0;h<o;h++)for(let d=0;d<r;d++){let u=(i.y+h)*n.cols+(i.x+d);c[u]&&c[u].classList.add(l?"hover":"bad")}}this.ui.tooltip&&this.ui.hideTooltip()}gridCoord(t,e){let i=this.root.querySelector("#inv-grid");if(!i)return null;let n=i.getBoundingClientRect(),s=8;if(t<n.left||t>n.right||e<n.top||e>n.bottom)return null;let r=(n.width-s*2)/this.game.inventory.cols,o=(n.height-s*2)/this.game.inventory.rows,l=Math.floor((t-n.left-s)/r-(this.drag?this.drag.offX/r-.5:.5)),c=Math.floor((e-n.top-s)/o-(this.drag?this.drag.offY/o-.5:.5));return{x:Z(l,0,this.game.inventory.cols-1),y:Z(c,0,this.game.inventory.rows-1)}}onUp(t){if(!this.drag)return;let e=this.drag;if(this.drag=null,e.moved){let i=this.gridCoord(t.clientX,t.clientY);i&&(this.game.inventory.moveItem(e.uid,i.x,i.y,e.rot)?this.game.audio.uiClick():this.game.notify("No room there."))}this.refreshAll()}onHover(t){if(this.drag)return;let e=t.target.closest(".item");if(!e){this.ui.hideTooltip();return}let i=+e.dataset.uid;if(this.hoverItem===i){this.ui.moveTooltip(t.clientX,t.clientY);return}this.hoverItem=i;let n=this.game.inventory.items.find(r=>r.uid===i);if(!n)return;let s=this.itemDef(n.id);this.ui.showTooltip(t.clientX,t.clientY,`
      <div class="tt-name">${ee(s?.name||n.id)}${n.qty>1?` \xD7${n.qty}`:""}</div>
      <div class="tt-cat">${ee((s?.cat||s?.type||"item").toUpperCase())}</div>
      <div class="tt-desc">${ee(s?.desc||"")}</div>
      ${s?.dmg?`<div class="tt-extra">DMG ${s.dmg} \xB7 ${s.rate?.toFixed(1)}/s${s.mag?` \xB7 MAG ${s.mag}`:""}</div>`:""}
      ${s?.armor?`<div class="tt-extra">ARMOR ${s.armor}${s.radResist?` \xB7 RAD ${Math.round(s.radResist*100)}%`:""}</div>`:""}
      ${n.durability!==void 0&&s?.type?`<div class="tt-extra">CONDITION ${Math.round(n.durability*100)}%</div>`:""}
    `)}};var vn=(a,t,e)=>{let i=document.createElement(a);return t&&(i.className=t),e!==void 0&&(i.innerHTML=e),i},Fn=a=>String(a).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Ga=class{constructor(t){this.game=t,this.mode="loading",this.dialogueState=null,this.shopState=null,this.tooltipEl=null,this.type=null,this._buildRoot(),this.hud=new Ha(t),this.panels=new Va(t,this),this.hud.attach(this.root),this._buildMenus(),this.applySettings()}_buildRoot(){if(!document.getElementById("ui-style")){let e=document.createElement("style");e.id="ui-style",e.textContent=Sd,document.head.appendChild(e)}let t=document.getElementById("ui");t||(t=vn("div"),t.id="ui",document.body.appendChild(t)),this.root=t}attachHud(){this.hud.attach(this.root)}isBlockingInput(){return!!this.shopState||!!this.dialogueState||this.panels.visible()||this.mode==="paused"||this.mode==="menu"||this.mode==="dead"||this.mode==="loading"}onPanelOpen(){this._panelReturn=this.game.mode==="menu"?"menu":this.pauseEl?.classList.contains("open")?"paused":"playing",this.mode="panel",this.game.locked=!0,this.hud.setCrosshair(!1),this.hud.setPrompt(null),this.game.audio.uiClick()}onPanelClose(){if(this.game.audio.uiClick(),this._panelReturn==="menu"){this.mode="menu",this.game.mode="menu",this.game.locked=!1,this.showMainMenu(this.game.hasSave()),this.hud.setVisible(!1);return}if(this._panelReturn==="paused"){this.mode="paused",this.game.locked=!0,this.pauseEl.classList.add("open");return}this.mode="playing",this.game.mode="playing",this.game.locked=!1,this.hud.setCrosshair(!0)}showLoading(){this.loading||(this.loading=vn("div"),this.loading.id="loading",this.loading.innerHTML=`
        <div class="load-title">ASHES OF HUMANITY</div>
        <div class="load-bar"><i id="load-fill"></i></div>
        <div class="load-step" id="load-step">INITIALISING</div>
        <div class="load-tip" id="load-tip"></div>`,document.body.appendChild(this.loading)),this.loading.classList.remove("done"),this.mode="loading"}setLoading(t,e){let i=document.getElementById("load-fill"),n=document.getElementById("load-step"),s=document.getElementById("load-tip");i&&(i.style.width=Z(t,0,100)+"%"),n&&(n.textContent=(e||"").toUpperCase()),s&&!s.textContent&&(s.textContent=this.randomTip())}randomTip(){let t=["The Hollow hunt by sound. Crouch and they will walk past you.","Bandages stop bleeding. A medkit repairs a limb, but only a splint fixes a fracture.","Radiation accumulates in the red wasteland. Anti-rad injections bind it before it becomes damage.","Food and water drain faster while sprinting. So does your stamina.","Weapons wear out. Repair them at a workbench before the barrel fails.","Every region has a boss. The arenas are marked on the map once you get close.","Resonance shards sell for a fortune. They also hum at night, which attracts things.","You can build a fire to stay warm. Hypothermia costs stamina and accuracy.","The signal repeats every night at the same hour. It is not random."];return t[Math.floor(Math.random()*t.length)]}hideLoading(){let t=document.getElementById("loading");t&&(t.classList.add("done"),this.mode="playing")}_buildMenus(){this.tooltipEl=vn("div"),this.tooltipEl.id="tooltip",document.body.appendChild(this.tooltipEl),this.dialogueEl=vn("div"),this.dialogueEl.id="dialogue",this.dialogueEl.innerHTML=`
      <div class="dlg-head">
        <div class="dlg-portrait" id="dlg-portrait"></div>
        <div class="dlg-id"><div class="dlg-name" id="dlg-name"></div><div class="dlg-role" id="dlg-role"></div></div>
        <div class="close-x pe" id="dlg-close">${bi.close}</div>
      </div>
      <div class="dlg-body"><div class="dlg-text" id="dlg-text"></div></div>
      <div class="dlg-choices" id="dlg-choices"></div>`,this.root.appendChild(this.dialogueEl),this.dialogueEl.querySelector("#dlg-close").onclick=()=>this.game.npcs.close(),this.dialogueEl.querySelector(".dlg-body").onclick=()=>this.skipTypewriter(),this.shopEl=vn("div"),this.shopEl.id="shop",this.shopEl.innerHTML=`
      <div class="scr-head" style="padding:16px 22px 12px">
        <h1 style="font-size:16px;letter-spacing:.3em" id="shop-title">TRADE</h1>
        <div style="display:flex;align-items:center;gap:16px">
          <div class="gold" id="shop-gold"></div>
          <div class="close-x pe" id="shop-close">${bi.close}</div>
        </div>
      </div>
      <div class="shop-body">
        <div class="shop-col"><h3>Their stock</h3><div class="shop-list" id="shop-buy"></div></div>
        <div class="shop-col"><h3>Your pack</h3><div class="shop-list" id="shop-sell"></div></div>
      </div>
      <div class="scr-foot"><span>CLICK TO BUY OR SELL ONE</span><span>SHIFT + CLICK FOR FIVE</span></div>`,this.root.appendChild(this.shopEl),this.shopEl.querySelector("#shop-close").onclick=()=>this.closeShop(),this.shopEl.addEventListener("click",t=>this.onShopClick(t)),this.pauseEl=vn("div"),this.pauseEl.id="pause",this.pauseEl.innerHTML=`
      <div class="pause-box">
        <h2>Paused</h2>
        <div class="p-sub">ASHES OF HUMANITY \xB7 LAST SIGNAL</div>
        <button class="btn pe" data-act="resume">Resume</button>
        <button class="btn pe" data-act="save">Save Progress</button>
        <button class="btn pe" data-act="load">Load Last Save</button>
        <button class="btn pe" data-act="settings">Settings</button>
        <button class="btn pe" data-act="medical">Medical</button>
        <button class="btn pe" data-act="menu">Main Menu</button>
        <div class="tiny" style="margin-top:14px" id="pause-info"></div>
      </div>`,this.root.appendChild(this.pauseEl),this.pauseEl.addEventListener("click",t=>this.onPauseClick(t)),this.deathEl=vn("div"),this.deathEl.id="death",this.deathEl.innerHTML=`
      <div class="death-title">YOU DIED</div>
      <div class="death-sub" id="death-cause">THE WASTELAND KEEPS WHAT IT TAKES</div>
      <div class="death-stats">
        <div class="death-stat"><b id="death-level">1</b><span>Level</span></div>
        <div class="death-stat"><b id="death-kills">0</b><span>Kills</span></div>
        <div class="death-stat"><b id="death-time">0m</b><span>Survived</span></div>
        <div class="death-stat"><b id="death-quests">0</b><span>Objectives</span></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn primary pe" data-act="respawn">Respawn at Shelter 12</button>
        <button class="btn pe" data-act="load">Load Last Save</button>
        <button class="btn pe" data-act="menu">Main Menu</button>
      </div>
      <div class="tiny" style="margin-top:26px">YOU WILL LOSE WHAT YOU WERE CARRYING</div>`,this.root.appendChild(this.deathEl),this.deathEl.addEventListener("click",t=>this.onDeathClick(t)),this.menuEl=vn("div"),this.menuEl.id="mainmenu",this.menuEl.innerHTML=`
      <div class="mm-title"><h1>ASHES OF HUMANITY</h1><h2>LAST SIGNAL</h2></div>
      <div class="mm-sub">A POST-APOCALYPTIC SURVIVAL ROLEPLAYING GAME</div>
      <div class="mm-menu">
        <button class="btn primary pe" data-act="new">New Game</button>
        <button class="btn pe" data-act="continue">Continue</button>
        <button class="btn pe" data-act="settings">Settings</button>
        <button class="btn pe" data-act="controls">Controls</button>
        <button class="btn pe" data-act="credits">Credits</button>
      </div>
      <div class="mm-foot">PROCEDURAL WORLD \xB7 ORIGINAL AUDIO \xB7 NO TWO DEAD CITIES ALIKE</div>
      <div class="mm-build" id="mm-build"></div>`,this.root.appendChild(this.menuEl),this.menuEl.addEventListener("click",t=>this.onMenuClick(t))}setBuildTag(t){let e=this.menuEl.querySelector("#mm-build");e&&(e.innerHTML=t)}showMainMenu(t){this.mode="menu",this.menuEl.classList.add("open"),this.hud.setVisible(!1);let e=this.menuEl.querySelector('[data-act="continue"]');e&&(e.style.display=t?"":"none")}hideMainMenu(){this.menuEl.classList.remove("open"),(this.game.mode==="playing"||this.mode==="menu")&&(this.mode="playing"),this.hud.setCrosshair(!0)}onMenuClick(t){let e=t.target.closest("[data-act]");if(!e)return;this.game.audio.uiClick();let i=e.dataset.act;i==="new"&&this.game.startNewGame(),i==="continue"&&this.game.continueGame(),i==="settings"&&(this.hideMainMenu(),this.panels.open("settings")),i==="controls"&&(this.hideMainMenu(),this.panels.open("settings"),this.panels.render()),i==="credits"&&(this.hideMainMenu(),this.panels.open("notes"))}openPause(){if(this.mode==="dead"||this.mode==="menu")return;this.mode="paused",this.pauseEl.classList.add("open"),this.game.locked=!0,this.game.audio.uiClick();let t=this.pauseEl.querySelector("#pause-info");if(t){let e=this.game;t.textContent=`LEVEL ${e.level||1} \xB7 ${e.quests.completedCount} OBJECTIVES \xB7 ${Math.floor((e.time||0)/60)} MIN PLAYED`}}closePause(){this.pauseEl.classList.remove("open"),this.mode="playing",this.game.locked=!1}onPauseClick(t){let e=t.target.closest("[data-act]");if(!e)return;let i=e.dataset.act;this.game.audio.uiClick(),i==="resume"&&this.closePause(),i==="save"&&(this.game.saveGame(!0),this.hud.notify("Progress saved","Your journal, pack and position were written to the shelter terminal.",null,"good")),i==="load"&&(this.closePause(),this.game.loadGame()),i==="settings"&&(this.pauseEl.classList.remove("open"),this.mode="playing",this.panels.open("settings")),i==="medical"&&(this.pauseEl.classList.remove("open"),this.mode="playing",this.panels.open("medical")),i==="menu"&&this.game.toMainMenu()}showDeath(t=""){this.mode="dead",this.game.locked=!0,this.deathEl.classList.add("open");let e=this.game;this.deathEl.querySelector("#death-cause").textContent=t||"THE WASTELAND KEEPS WHAT IT TAKES",this.deathEl.querySelector("#death-level").textContent=e.level||1,this.deathEl.querySelector("#death-kills").textContent=e.stats?.kills||0,this.deathEl.querySelector("#death-time").textContent=Math.floor((e.time||0)/60)+"m",this.deathEl.querySelector("#death-quests").textContent=e.quests.completedCount,this.hud.setCrosshair(!1)}hideDeath(){this.deathEl.classList.remove("open"),this.mode="playing",this.game.locked=!1}onDeathClick(t){let e=t.target.closest("[data-act]");if(!e)return;let i=e.dataset.act;i==="respawn"&&(this.hideDeath(),this.game.respawnPlayer()),i==="load"&&(this.hideDeath(),this.game.loadGame()),i==="menu"&&(this.hideDeath(),this.game.toMainMenu())}setVisible(t){this.hud.setVisible(t)}notify(t,e,i,n){return this.hud.notify(t,e,i,n)}notifyQuest(t,e){return this.hud.notifyQuest(t,e)}notifyObjective(t,e,i,n){this.hud.toast(t,`${e}${n>1?`  \u2014  ${i}/${n}`:""}`,"quest")}setPrompt(t){this.hud.setPrompt(t)}promptVisible(){return this.hud.promptVisible()}hitMarker(t){this.hud.hitMarker(t)}flashDamage(t){this.hud.flashDamage(t)}updateWeapon(){this.hud.updateWeapon()}updateEquipment(){this.hud.updateWeapon()}refreshJournal(){this.panels.screen==="journal"&&this.panels.render()}update(t){this.mode==="loading"||this.mode==="menu"||(this.hud.update(t),this.hud.updateNotifications(t),this.tickTypewriter(t))}openDialogue(t,e){this.dialogueEl.classList.add("open"),this.dialogueEl.querySelector("#dlg-name").textContent=t.toUpperCase(),this.dialogueEl.querySelector("#dlg-role").textContent=(e||"").toUpperCase(),this.dialogueEl.querySelector("#dlg-portrait").textContent=t.split(" ").map(i=>i[0]).slice(0,2).join(""),this.mode="dialogue",this.game.locked=!0,this.hud.setCrosshair(!1)}showDialogue(t){this.dialogueState=t;let e=this.dialogueEl.querySelector("#dlg-text");this.type={full:t.text||"",shown:0,t:0,speed:68,el:e,done:!1},e.textContent="";let i=this.dialogueEl.querySelector("#dlg-choices");i.innerHTML=(t.choices||[]).map((n,s)=>`<div class="dlg-choice pe" data-i="${s}"><span class="n">${s+1}</span><span>${Fn(n.text)}</span></div>`).join("");for(let n of i.children)n.onclick=()=>{if(!this.type.done){this.skipTypewriter();return}this.game.npcs.choose(+n.dataset.i)},n.onmouseenter=()=>{for(let s of i.children)s.classList.remove("hl");n.classList.add("hl")};this.dialogueEl.querySelector("#dlg-portrait").textContent=(t.speaker||"").split(" ").map(n=>n[0]).slice(0,2).join(""),this.dialogueEl.querySelector("#dlg-name").textContent=(t.speaker||"").toUpperCase(),this.dialogueEl.querySelector("#dlg-role").textContent=(t.role||"").toUpperCase()}tickTypewriter(t){if(!this.type||this.type.done)return;let e=this.type;e.t+=t;let i=Math.floor(e.t*e.speed);i>e.shown&&(e.shown=Math.min(i,e.full.length),e.el.innerHTML=Fn(e.full.slice(0,e.shown))+(e.shown<e.full.length?'<span class="dlg-caret"></span>':""),e.shown>=e.full.length&&(e.done=!0))}skipTypewriter(){this.type&&(this.type.shown=this.type.full.length,this.type.done=!0,this.type.el.innerHTML=Fn(this.type.full))}closeDialogue(){this.dialogueEl.classList.remove("open"),this.dialogueState=null,this.type=null;for(let t of this.dialogueEl.querySelectorAll(".dlg-choice"))t.onclick=null;this.mode="playing",this.game.locked=!1,this.hud.setCrosshair(!0)}openShop(t,e){this.shopState={npc:t,shop:e},this.shopEl.classList.add("open"),this.mode="shop",this.game.locked=!0,this.hud.setCrosshair(!1),this.shopEl.querySelector("#shop-title").textContent=`TRADE \xB7 ${t.def.name.toUpperCase()}`,this.renderShop()}closeShop(){this.shopEl.classList.remove("open"),this.shopState=null,this.mode="playing",this.game.locked=!1,this.hud.setCrosshair(!0),this.game.npcs.dialogue&&this.game.npcs.close()}refreshShop(){this.shopState&&this.renderShop()}renderShop(){let{npc:t,shop:e}=this.shopState,n=this.game.inventory;this.shopEl.querySelector("#shop-gold").innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="7"/><path d="M9.5 9.5 H14.5 M9.5 14.5 H14.5 M12 7 V17"/></svg><b>${n.gold}</b>`;let s=Object.entries(e.stock).filter(([,o])=>o.qty>0).map(([o,l])=>{let c=qe[o]||Me[o],h=e.priceOf(o);return`<div class="shop-row pe" data-buy="${o}">
        ${vi(o,c,{size:28})}
        <div class="s-main"><div class="s-name">${Fn(c?.name||o)}</div>
          <div class="s-qty">${l.qty} in stock \xB7 ${Fn((c?.cat||"item").toUpperCase())}</div></div>
        <div class="s-price">${h}</div></div>`}).join("")||'<div class="empty-state">Sold out</div>',r=n.items.map(o=>{let l=qe[o.id]||Me[o.id],c=e.sellPrice(o.id)*o.qty,h=l?.cat==="quest";return`<div class="shop-row pe" data-sell="${o.uid}" style="${h?"opacity:.45":""}">
        ${vi(o.id,l,{size:28})}
        <div class="s-main"><div class="s-name">${Fn(l?.name||o.id)}${o.qty>1?" \xD7"+o.qty:""}</div>
          <div class="s-qty">${h?"NOT FOR SALE":Fn((l?.cat||"item").toUpperCase())}</div></div>
        <div class="s-price">${h?"\u2014":c}</div></div>`}).join("")||'<div class="empty-state">Your pack is empty</div>';this.shopEl.querySelector("#shop-buy").innerHTML=s,this.shopEl.querySelector("#shop-sell").innerHTML=r}onShopClick(t){if(!this.shopState)return;let e=t.target.closest("[data-buy]"),i=t.target.closest("[data-sell]"),n=t.shiftKey?5:1;if(e)this.shopState.shop.buy(e.dataset.buy,n)&&this.hud.toast("Purchased","","good"),this.renderShop();else if(i){let s=+i.dataset.sell,r=this.game.inventory.items.find(l=>l.uid===s);if((r?qe[r.id]||Me[r.id]:null)?.cat==="quest"){this.hud.notify("Refused","They will not buy something the Wardens are looking for.");return}if(t.shiftKey&&r)for(let l=0;l<5&&this.shopState.shop.sell(s);l++);else this.shopState.shop.sell(s);this.renderShop()}}showTooltip(t,e,i){this.tooltipEl.innerHTML=i,this.tooltipEl.classList.add("on"),this.moveTooltip(t,e)}moveTooltip(t,e){let i=this.tooltipEl.offsetWidth||220,n=this.tooltipEl.offsetHeight||100,s=t+16,r=e+12;s+i>window.innerWidth-12&&(s=t-i-16),r+n>window.innerHeight-12&&(r=window.innerHeight-n-12),this.tooltipEl.style.left=s+"px",this.tooltipEl.style.top=r+"px"}hideTooltip(){this.tooltipEl&&this.tooltipEl.classList.remove("on")}handleKey(t){let e=t.code;if(this.mode==="loading")return!0;if(this.mode==="menu")return e==="Escape"&&(this.hideMainMenu(),this.showMainMenu(this.game.hasSave())),!0;if(this.mode==="dead")return e==="Enter"&&(this.hideDeath(),this.game.respawnPlayer()),!0;if(this.dialogueState){if(e==="Escape")return this.game.npcs.close(),!0;if(e==="Space"||e==="Enter")return this.type&&!this.type.done&&this.skipTypewriter(),!0;if(/^Digit[1-9]$/.test(e)){let n=+e.slice(5)-1;return this.dialogueState.choices&&this.dialogueState.choices[n]&&(this.type&&!this.type.done?this.skipTypewriter():this.game.npcs.choose(n)),!0}return!0}if(this.shopState)return(e==="Escape"||e==="Tab")&&this.closeShop(),!0;if(this.panels.visible())return e==="Escape"||e==="Tab"?(this.panels.close(),!0):(e==="KeyH"&&this.panels.screen==="inventory"&&this.panels.swap("medical"),!0);if(this.mode==="paused")return e==="Escape"&&this.closePause(),!0;let i={Tab:"inventory",KeyI:"inventory",KeyK:"skills",KeyJ:"journal",KeyM:"map",KeyC:"craft",KeyB:"build",KeyH:"medical",KeyN:"notes"};return i[e]?(this.panels.open(i[e]),!0):e==="Escape"?(this.openPause(),!0):!1}applySettings(){let t=this.game.settings;this.game.audio&&(this.game.audio.setVolume?.(t.master),this.game.audio.setMusicVolume?.(t.music)),this.hud?.root.classList.toggle("no-anim",!1)}};var Wa="ashes_of_humanity_save_v1",qa="ashes_of_humanity_auto_v1";function Xa(){try{return typeof localStorage>"u"?null:localStorage}catch{return null}}function Cd(a,t=!1){let e=Xa();if(!e)return!1;try{return e.setItem(t?qa:Wa,JSON.stringify(a)),!0}catch(i){return console.warn("save failed",i),!1}}function or(a=!1){let t=Xa();if(!t)return null;try{let e=t.getItem(a?qa:Wa);return e?JSON.parse(e):null}catch{return null}}function $a(){let a=Xa();return a?!!(a.getItem(Wa)||a.getItem(qa)):!1}function kd(){let a=Xa();a&&(a.removeItem(Wa),a.removeItem(qa))}var h1=[{id:"shelter_locker",label:"Search the locker",x:-352.1,z:154.2,dy:.9,kind:"locker"},{id:"shelter_console",label:"Read the radio console",x:-353.4,z:146.8,dy:1.1,kind:"console"},{id:"shelter_note",label:"Read Mikhail's note",x:-366.6,z:146.6,dy:1,kind:"note"},{id:"school_valve",label:"Turn the water valve",poi:"sub_school",dx:6.5,dz:4,dy:.9,kind:"valve"},{id:"projector",label:"Stop the projector",poi:"sub_school",dx:-5,dz:-2,dy:1,kind:"projector"},{id:"crane_panel",label:"Start the rail crane",poi:"ind_depot",dx:3,dz:2,dy:1,kind:"console"},{id:"warehouse_breaker",label:"Throw the breaker",poi:"ind_warehouse",dx:-4,dz:3,dy:1.2,kind:"breaker"},{id:"hospital_barricade",label:"Bar the doors",poi:"city_hospital",dx:2.5,dz:3,dy:1,kind:"barricade"},{id:"delta_lamp",label:"Light the perimeter lamp",poi:"mil_camp",dx:-3,dz:2,dy:1.1,kind:"lamp"},{id:"perimeter_cut",label:"Cut the perimeter wire",poi:"mil_camp",dx:7,dz:-4,dy:1,kind:"wire"},{id:"array_console",label:"Access the array console",poi:"was_array",dx:2,dz:-3,dy:1.1,kind:"array"}],d1={master:.8,music:.55,sfx:.9,fov:72,renderScale:1,brightness:1,viewDistance:1,shadows:!0,quality:"high",motionBlur:!1,sensitivity:1,gamepadSens:1,invertY:!1,difficulty:"survivor",cameraMode:0,autoPickup:!0,showDamage:!0},Ya=class{constructor(t={}){this.opts=t,this.headless=!!t.headless,this.lite=!!t.lite,this.container=t.container||document.body,this.seed=t.seed||20261026,this.time=0,this.day=1,this.difficulty=1,this.locked=!1,this.cameraMode=0,this.act=1,this.hitStop=0,this.stats={kills:0,headshots:0,damageDealt:0,damageTaken:0,deaths:0,distance:0},this.codex={mutants:{},kills:{},bosses:{},bossSeen:{},regions:{}},this.skillRanks={},this.skills={},this.level=1,this.xp=0,this.skillPoints=0,this.buildCount=0,this.buildings=[],this.objectives=[],this.eventState={},this.settings={...d1},this.mode="loading",this.waypoint=null,this.selectedQuick=0,this.paused=!1,this.dayTimer=0,this.autosaveTimer=0,this.finaleStarted=!1,this.bossBars=new Map,this._tmpV=new P,this._interactCooldown=0,this._poiSeen={}}async init(t){let e=typeof t=="function"?t:()=>{};this.loadSettings(),this.lite&&(this.settings.shadows=!1,this.settings.viewDistance=.45,this.settings.renderScale=Math.min(this.settings.renderScale,.5),this.settings.quality="low"),this.ui=new Ga(this),this.ui.showLoading(),this.ui.setLoading(2,"building renderer"),this.headless?this.renderer=null:(this.renderer=new na({antialias:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)*this.settings.renderScale),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.shadowMap.enabled=this.settings.shadows,this.renderer.shadowMap.type=Kl,this.renderer.outputColorSpace=Ye,this.renderer.toneMapping=Jl,this.renderer.toneMappingExposure=1.12*this.settings.brightness,this.container.appendChild(this.renderer.domElement)),this.scene=new ra,this.camera=new Ge(this.settings.fov,16/9,.08,1600),this.camera.position.set(-360,4,150),this.sky=new Ta(this.scene,this.renderer),this.sky.setWeather("overcast",!0),this.sun=new ua(16773856,2),this.sun.position.set(60,90,40),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048),this.sun.shadow.camera.near=1,this.sun.shadow.camera.far=260;let i=this.sun.shadow.camera;return i.left=-70,i.right=70,i.top=70,i.bottom=-70,this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.035,this.scene.add(this.sun),this.scene.add(this.sun.target),this.hemi=new ha(9412784,2761756,.75),this.scene.add(this.hemi),this.world=new Ea(this.scene,{seed:this.seed}),await this.world.generate((n,s)=>{this.ui.setLoading(4+s*.7,n),e(n,s)}),this.ui.setLoading(78,"waking the survivor"),this.player=new Aa(this.world),this.player.pos.copy(this.world.startPosition),this.player.yaw=Math.PI,this.player.cameraMode=this.settings.cameraMode,this.cameraMode=this.player.cameraMode,this.player.fov=this.settings.fov,this.player.sens=this.settings.sensitivity,this.player.skills=this.skills,this.body=new Da(this),this.inventory=new nr(this),this.quests=new sr(this),this.vfx=new Ra(this.scene),this.audio=new Ca(this.camera),this.doors=new Oa(this),this.loot=new rr(this),this.npcs=new La(this),this.npcs.spawn(),this.weapons=new er(this),this.combat=new ir(this),this.events=new Na(this),this.spawnSignalEntity(),this.spawnInteractables(),this.spawnEnemiesInitial(),this.applySkills(),this.setupDamageRouting(),this.setupInput(),this.bindUI(),this.ui.setLoading(94,"finalising"),this.ui.hideLoading(),this.ui.setBuildTag(`THREE.JS r169 / WEBGL2<br>WORLD SEED ${this.seed}<br>${this.world.pois.length} SITES \xB7 ${this.world.lootSpots.length} CACHES`),this.ui.showMainMenu($a()),this.mode="menu",this.headless||this.startLoop(),e("ready",100),this}setupInput(){if(this.input={keys:{},mouse:{dx:0,dy:0,left:!1,right:!1,leftPressed:!1,rightPressed:!1,wheel:0},pressed:{}},this.headless)return;let t=this.input.keys;window.addEventListener("keydown",i=>{if(i.repeat){this.input.pressed[i.code]=!1;return}if(this.ui&&this.ui.handleKey(i)){i.preventDefault();return}t[i.code]=!0,this.input.pressed[i.code]=!0,["Tab","Space","KeyE","KeyF","KeyR","KeyV","KeyH","KeyQ"].includes(i.code)&&i.preventDefault(),this.onKeyDown(i.code)}),window.addEventListener("keyup",i=>{t[i.code]=!1}),window.addEventListener("blur",()=>{for(let i of Object.keys(t))t[i]=!1}),window.addEventListener("mousemove",i=>{if(!this.locked)return;let n=this.settings.invertY?-1:1;this.input.mouse.dx+=i.movementX||0,this.input.mouse.dy+=(i.movementY||0)*n}),window.addEventListener("mousedown",i=>{if(!this.locked){this.requestLock();return}i.button===0&&(this.input.mouse.left=!0,this.input.mouse.leftPressed=!0),i.button===2&&(this.input.mouse.right=!0,this.input.mouse.rightPressed=!0)}),window.addEventListener("mouseup",i=>{i.button===0&&(this.input.mouse.left=!1),i.button===2&&(this.input.mouse.right=!1)}),window.addEventListener("wheel",i=>{this.input.mouse.wheel+=Math.sign(i.deltaY)},{passive:!0}),window.addEventListener("contextmenu",i=>i.preventDefault()),window.addEventListener("resize",()=>this.onResize()),document.addEventListener("pointerlockchange",()=>{this.locked=document.pointerLockElement===this.renderer?.domElement,!this.locked&&this.mode==="playing"&&!this.ui.panels.visible()&&this.ui.mode!=="dialogue"&&this.ui.mode!=="shop"&&this.ui.openPause()});let e=this.renderer?.domElement;e&&e.addEventListener("click",()=>{this.mode==="playing"&&!this.locked&&this.requestLock()})}bindUI(){this.ui.hud.setVisible(!1)}requestLock(){if(this.headless||this.mode!=="playing")return;let t=this.renderer?.domElement;t&&t.requestPointerLock&&t.requestPointerLock()}onResize(){this.renderer&&(this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix(),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)*this.settings.renderScale),this.renderer.setSize(window.innerWidth,window.innerHeight))}onKeyDown(t){if(this.mode==="playing"){if(t==="KeyF"&&(this.player.flashlightOn=!this.player.flashlightOn,this.flashlight&&(this.flashlight.visible=this.player.flashlightOn),this.audio.uiClick()),t==="KeyV"&&(this.player.cameraMode=this.player.cameraMode===1?0:1,this.cameraMode=this.player.cameraMode,this.audio.uiClick()),t==="KeyE"&&this.tryInteract(),t==="KeyQ"&&this.toggleAimWeapon(),t==="KeyG"&&this.quickHeal(),/^Digit[1-4]$/.test(t)){let e=+t.slice(5)-1;this.selectQuickSlot(e)}t==="F5"&&this.saveGame(!0),t==="F9"&&this.loadGame()}}startNewGame(){kd(),this.resetProgression(),this.player.pos.copy(this.world.startPosition),this.player.yaw=Math.PI,this.player.pitch=0,this.player.stats.health=this.player.stats.healthMax,this.player.stamina=this.player.staminaMax,this.body.reset(),this.inventory=new nr(this),this.quests=new sr(this),this.weapons=new er(this),this.combat=new ir(this),this.combat.game=this,this.loot=new rr(this),this.doors.deserialize(this.doors.doors.map(e=>e.spec.startOpen||0)),this.enemiesKilled=new Set,this.clearEnemies(),this.spawnEnemiesInitial(),this.codex={mutants:{},kills:{},bosses:{},bossSeen:{},regions:{}},this.stats={kills:0,headshots:0,damageDealt:0,damageTaken:0,deaths:0,distance:0},this.time=0,this.day=1,this.sky.dayTime=.3,this.sky.setWeather("overcast",!0),this.act=1,this.finaleStarted=!1,this.waypoint=null,this.buildings.forEach(e=>this.scene.remove(e.mesh)),this.buildings=[],this.buildCount=0,this.inventory.add("flashlight",1),this.inventory.add("bandage",1),this.inventory.add("water_bottle",1);let t=this.inventory.items.find(e=>e.id==="flashlight");t&&this.inventory.equip(t.uid),this.player.flashlightOn=!0,this.setupFlashlight(),this.quests.start("m01"),this.act=1,this.ui.hideMainMenu(),this.ui.setVisible(!0),this.ui.hud.setVisible(!0),this.ui.hud.setCrosshair(!0),this.ui.closePause?.(),this.mode="playing",this.locked=!1,this.ui.notify("SHELTER 12","Seven metres under the Dead Suburbs. The air tastes like battery acid.","#c9963f","quest"),this.quests.start("m01"),this.updateObjectives(),this.headless||this.requestLock(),this.audio.init(),this.audio.startMusic(),this.saveGame(!1)}continueGame(){let t=or(!1)||or(!0);if(!t){this.startNewGame();return}this.ui.hideMainMenu(),this.ui.setVisible(!0),this.ui.hud.setVisible(!0),this.mode="playing",this.audio.init(),this.loadData(t),this.updateObjectives(),this.headless||this.requestLock()}toMainMenu(){this.mode="menu",this.locked=!1,document.exitPointerLock&&document.exitPointerLock(),this.ui.closePause(),this.pauseEl?.classList.remove("open"),this.ui.showMainMenu($a()),this.ui.hud.setVisible(!1),this.audio.stopMusic?.()}setupFlashlight(){if(this.headless)return;this.flashlight&&(this.scene.remove(this.flashlight),this.flashlight=null);let t=new da(16773327,7.5,34,.62,.72,1.25);t.castShadow=!1,this.scene.add(t),this.scene.add(t.target),this.flashlight=t,this.lantern&&(this.scene.remove(this.lantern),this.lantern=null);let e=new Ke(16763274,.9,9,2);e.castShadow=!1,this.scene.add(e),this.lantern=e}spawnSignalEntity(){let t=this.world.pois.find(e=>e.id==="was_array");t&&(this.signalEntity=_d(),this.signalEntity.position.set(t.x,t.y+.05,t.z),this.scene.add(this.signalEntity),this.signalLight=this.signalEntity.userData.light)}spawnEnemy(t,e,i,n={}){if(!Ti[t])return null;let s=new Js(this,t,e,i,n);return this.enemies.push(s),this.codex.mutants[t]=!0,s}spawnEnemyNear(t,e=30,i=50){let n=this.player.pos;for(let s=0;s<14;s++){let r=Math.random()*Math.PI*2,o=e+Math.random()*(i-e),l=Z(n.x+Math.cos(r)*o,-680,680),c=Z(n.z+Math.sin(r)*o,-480,480),h=this.world.heightAt(l,c);if(isFinite(h)&&!this.world.isIndoor(l,h+1,c))return this.spawnEnemy(t,l,c)}return null}spawnEnemiesInitial(){this.enemies=[],this.bosses=[],this.enemiesKilled=new Set;let t=new Pt(this.seed+9001),e={suburbs:["hollow","hollow","crawler","mimic"],forest:["crawler","stalker","burrower","hollow"],industrial:["hollow","brute","screamer","crawler"],city:["hollow","stalker","crawler","screamer","mimic"],military:["hollow","watcher","brute","stalker"],wasteland:["contaminated","pale","burrower","watcher"]},i=this.world.startPosition;for(let n of this.world.pois){if(n.type==="boss"||n.id.startsWith("was_array")||this.lite&&Math.hypot(n.x-i.x,n.z-i.z)>160)continue;let s=this.world.regionAt(n.x,n.z).id,r=e[s]||e.suburbs,o=n.type==="camp"||n.type==="shelter"?0:t.int(1,3);for(let l=0;l<o;l++){let c=t.range(0,Math.PI*2),h=t.range(9,26),d=Z(n.x+Math.cos(c)*h,-680,680),u=Z(n.z+Math.sin(c)*h,-480,480);this.world.isIndoor(d,this.world.heightAt(d,u)+1,u)||this.spawnEnemy(t.pick(r),d,u)}}for(let n=0;n<(this.lite?0:46);n++){let s=t.range(-660,660),r=t.range(-460,470),o=this.world.regionAt(s,r).id,l=e[o]||e.suburbs;this.spawnEnemy(t.pick(l),s,r)}}clearEnemies(){for(let t of this.enemies)t.dispose();this.enemies=[],this.bosses=[]}removeEnemy(t){let e=this.enemies.indexOf(t);e>=0&&this.enemies.splice(e,1),t.dispose();let i=this.bosses.indexOf(t);i>=0&&(this.bosses.splice(i,1),this.bossBars.delete(t),this.bossBars.size===0&&this.ui.hud.hideBoss())}alertEnemiesToNoise(t,e,i=1,n=40){for(let s of this.enemies)s.dead||Math.hypot(s.pos.x-t,s.pos.z-e)<n&&s.hear(i,t,e)}keepInArena(t){if(!t.arena)return;let e=t.arena,i=Math.hypot(t.pos.x-e.x,t.pos.z-e.z),n=(e.radius||18)*1.15;if(i>n){let s=n/i;t.pos.x=e.x+(t.pos.x-e.x)*s,t.pos.z=e.z+(t.pos.z-e.z)*s}}updateArenas(t){let e=this.player.pos;for(let[i,n]of Object.entries(this.world.arenas)){let s=Math.hypot(e.x-n.x,e.z-n.z),r=n.boss;if(!(!r||!zn[r])&&!this.codex.bosses[r]&&s<28&&!n._spawned){n._spawned=!0;let o=new Qs(this,r);o.arena=n,this.enemies.push(o),this.bosses.push(o),this.codex.bossSeen[r]=!0,this.bossBars.set(o,!0),this.audio.bossRoar(o.pos),this.ui.hud.showBoss(o.name,o.phase,o.maxPhases,`WARDEN ASSET \xB7 ${(hi.find(l=>l.id===n.region)?.name||"").toUpperCase()}`),this.ui.notify(o.name,o.bossDef.desc,"#c05038","danger"),this.act=Math.max(this.act,this.questForBoss(r))}}if(this.bossBars.size){for(let i of[...this.bossBars.keys()]){if(i.dead){this.bossBars.delete(i);continue}Math.hypot(e.x-i.pos.x,e.z-i.pos.z)>70&&this.bossBars.delete(i),this.ui.hud.setBossHP(i.hp/i.hpMax),this.ui.hud.showBoss(i.name,i.phase,i.maxPhases,i.enraged?"ENRAGED":"")}this.bossBars.size||this.ui.hud.hideBoss()}}questForBoss(t){return ka.find(i=>i.objectives.some(n=>n.type==="boss"&&n.boss===t))?.act||1}bossSweep(t,e){let i=this.player,n=Math.hypot(i.pos.x-t.pos.x,i.pos.z-t.pos.z);this.vfx.meleeArc(t.pos,t.yaw,e,16732208),this.audio.bossSwing(t.pos),n<e&&(i.applyDamage(t.def.dmg*1.4,{body:"torso",bleed:10,fracture:Math.random()<.2}),this.ui.flashDamage(1)),this.spawnShockwave(t.pos,e*.6,12603448)}bossSummon(t,e=null,i=null){let n=e?[e]:Ti[t.def.mutant]?[t.def.mutant]:["hollow"],s=i??3;for(let r=0;r<s;r++){let o=Math.random()*Math.PI*2,l=4+Math.random()*6,c=t.pos.x+Math.cos(o)*l,h=t.pos.z+Math.sin(o)*l,d=this.spawnEnemy(n[0],c,h,{speedMul:1.05});d&&d.setState?.("chase"),this.spawnShockwave(new P(c,t.pos.y,h),1.6,8978312)}this.ui.notify("The arena answers","Something crawled out of the ground.",null,"danger")}bossProjectileFan(t,e,i=16736288,n={}){let s=this.player,r=t.center.clone();for(let o=0;o<e;o++){let l=(n.spread??.16)*(o-(e-1)/2),h=s.pos.clone().add(new P(0,1.1,0)).sub(r).normalize(),d=Math.atan2(h.x,h.z)+l,u=r.clone().add(new P(Math.sin(d)*30,0,Math.cos(d)*30));this.combat.spawnProjectile(r,u,{speed:n.speed||22,damage:n.damage||26,owner:"enemy",color:i,radius:.28,onHit:()=>{this.audio.impactHard(t.pos),this.vfx.impact(s.pos,new P(0,1,0),"metal")}})}this.audio.bossSwing(t.pos)}bossScreamShock(t){let e=this.player,i=Math.hypot(e.pos.x-t.pos.x,e.pos.z-t.pos.z);this.audio.scream(t.pos),i<18&&(e.applyDamage(18,{bleed:6,body:"head"}),e.addShake(.8),e.stats.stress=Z(e.stats.stress+18,0,100),this.ui.flashDamage(1));for(let n of this.enemies)n!==t&&!n.dead&&Math.hypot(n.pos.x-e.pos.x,n.pos.z-e.pos.z)<40&&(n.lastKnown.copy(e.pos),n.setState?.("chase"))}bossWebBind(t){let e=this.player;e.applyDamage(8,{body:"legs"}),e.slowT=3,e.stamina=Math.max(0,e.stamina-25),this.ui.notify("Webbed","Your legs are bound. Break free by moving.",null,"danger"),this.vfx.gasCloud(e.pos,2,3,14211264)}bossSlashCombo(t){let e=this.player;for(let i=0;i<3;i++)setTimeout(()=>{if(t.dead||e.dead)return;let n=Math.hypot(e.pos.x-t.pos.x,e.pos.z-t.pos.z);this.vfx.meleeArc(t.pos,t.yaw,5.5,16724016),this.audio.bossSwing(t.pos),n<5.5&&(e.applyDamage(t.def.dmg*.85,{body:"torso",bleed:8}),this.ui.flashDamage(.8))},260*i+120)}bossPhaseShift(t){t.pos.x+=(Math.random()-.5)*6,t.pos.z+=(Math.random()-.5)*6,this.spawnShockwave(t.pos,8,10514687),this.vfx.gasCloud(t.pos,4.5,4,7360672)}bossCollapse(t){this.spawnShockwave(t.pos,14,16777215),this.vfx.dustBurst(t.pos,60,2.2);let e=this.player;Math.hypot(e.pos.x-t.pos.x,e.pos.z-t.pos.z)<14&&(e.applyDamage(24,{body:"legs",fracture:!0}),e.addShake(1)),this.audio.impactHard(t.pos)}spawnShockwave(t,e,i=16777215){this.vfx.spawnShockwave(t,e,i)}spawnProjectile(t,e,i={}){return this.combat.spawnProjectile(t,e,i)}spawnGasCloud(t,e,i,n){this.vfx.gasCloud(t,e,i,n),this.hazardClouds=this.hazardClouds||[],this.hazardClouds.push({x:t.x,z:t.z,r:e,life:i,t:0,damage:4})}spawnSupplyCrate(t,e,i="military"){let n=this.world.heightAt(t,e);if(!isFinite(n))return null;let s=yc("crate",new Pt(Math.floor(t*13+e*7)));s.position.set(t,n,e),s.rotation.y=Math.random()*Math.PI;let r=new At(new ii(.35,.35,14,8,1,!0),new Ce({color:16756832,transparent:!0,opacity:.13,depthWrite:!1,side:_e}));r.position.set(t,n+7,e),this.scene.add(s),this.scene.add(r),setTimeout(()=>this.scene.remove(r),9e4);let o={id:this.loot.spots.length,x:t,y:n,z:e,table:i,kind:"crate",looted:!1,mesh:s,supply:!0};this.loot.spots.push(o);let l=Math.floor(t/8)+","+Math.floor(e/8);return this.loot.index.has(l)||this.loot.index.set(l,[]),this.loot.index.get(l).push(o),o}dropLootBag(t,e,i,n,s){let r=yc("bag",new Pt(Math.floor(i*31+s*17)));r.position.set(i,n+.05,s),this.scene.add(r);let o={id:this.loot.spots.length,x:i,y:n,z:s,table:"tool",kind:"bag",looted:!1,mesh:r,forced:{id:t,qty:e}};this.loot.spots.push(o);let l=Math.floor(i/8)+","+Math.floor(s/8);return this.loot.index.has(l)||this.loot.index.set(l,[]),this.loot.index.get(l).push(o),o}setupDamageRouting(){let t=this.player,e=t.applyDamage.bind(t);t.applyDamage=(i,n={})=>{if(t.dead)return 0;let s=this.body.incoming(i,n.body),r=e(s.amount,n);return this.body.hit(s.part,r,n),this.stats.damageTaken+=r,this.ui.flashDamage(Z(r/30,.25,1)),this.lastDamagePart=s.part,t.dead&&this.onPlayerDeath(),r}}onPlayerDeath(){this.mode!=="dead"&&(this.stats.deaths++,this.audio.stopMusic?.(),this.audio.enemyDeath?.("hollow",this.player.pos),this.mode="dead",this.locked=!1,this.ui.showDeath(this.deathCause||"BLOOD LOSS"),document.exitPointerLock&&document.exitPointerLock())}respawnPlayer(){this.player.dead=!1,this.player.pos.copy(this.world.startPosition),this.player.vel.set(0,0,0),this.player.stats.health=this.player.stats.healthMax*.7,this.player.stamina=this.player.staminaMax,this.body.reset(),this.player.stats.hunger=Math.max(40,this.player.stats.hunger),this.player.stats.thirst=Math.max(40,this.player.stats.thirst),this.player.stats.bleed=0,this.player.stats.radiation=Math.max(0,this.player.stats.radiation-20);let t=this.inventory,e=t.items.slice(0,Math.floor(t.items.length/2));for(let i of e){let n=this.player.pos;this.dropLootBag(i.id,i.qty,n.x+(Math.random()-.5)*2,n.y,n.z+(Math.random()-.5)*2),t.removeUid(i.uid,999)}this.mode="playing",this.ui.hideDeath(),this.ui.hud.setCrosshair(!0),this.ui.notify("SHELTER 12","You wake up on the floor. Something took your pack while you were gone.","#c9963f"),this.saveGame(!1),this.headless||this.requestLock()}resetProgression(){this.level=1,this.xp=0,this.skillPoints=0,this.skillRanks={},this.skills={},this.player.skills=this.skills,this.levelUps=0,this.applySkills(!0)}xpToNext(t=this.level){return Math.round(ys.xp.base*Math.pow(ys.xp.factor,t-1))}giveXP(t,e=""){if(t<=0)return;this.xp+=t;let i=0;for(;this.level<50&&this.xp>=this.xpToNext();)this.xp-=this.xpToNext(),this.level++,i++,this.skillPoints+=1;i&&(this.applySkills(),this.player.stats.health=this.player.stats.healthMax,this.player.stamina=this.player.staminaMax,this.audio.levelUp?.(),this.ui.notify("LEVEL "+this.level,`You survived long enough to learn something. +${i} skill point${i>1?"s":""}.`,"#e0b463","good"),this.ui.hud.notifyQuest("LEVEL UP","Open the skill screen (K) to spend your points.")),this.updateObjectives()}applySkills(t=!1){let e=this.player,i={};for(let[r,o]of Object.entries(Vs))for(let l of o.nodes){let c=this.skillRanks[l.id]||0;c&&(i[l.effect]=(i[l.effect]||0)+l.per*c)}e.skills=i,this.skills=i;let n=100+(this.level-1)*2,s=100+(this.level-1)*1;e.stats.healthMax=Math.round(n+(i.healthMax||0)),e.stats.staminaMax=Math.round(s+(i.staminaMax||0)),e.staminaMax=e.stats.staminaMax,e.damageMul=1+(i.damage||0)+(e.stats.health<e.stats.healthMax*.3&&i.adrenaline?.1:0),t&&(e.stats.health=e.stats.healthMax,e.stats.stamina=e.stats.staminaMax),e.stats.health=Math.min(e.stats.health,e.stats.healthMax),e.stats.stamina=Math.min(e.stats.stamina,e.stats.staminaMax),this.inventory?.recalcEquipment?.()}spendSkillPoint(t){let e=null,i=null;for(let[s,r]of Object.entries(Vs)){let o=r.nodes.find(l=>l.id===t);if(o){e=o,i=s;break}}if(!e)return!1;if(!this.skillPoints)return this.notify("No skill points","Gain a level first."),!1;let n=this.skillRanks[e.id]||0;if(n>=e.max)return!1;for(let s of e.req)if(!(this.skillRanks[s]>0))return this.notify("Locked","Requires the previous skill in this tree."),!1;return this.skillRanks[e.id]=n+1,this.skillPoints--,this.applySkills(),this.audio.uiClick(),this.ui.notify(e.name,`Rank ${n+1} / ${e.max} \u2014 ${e.desc}`,"#c9963f","good"),!0}applyConsumable(t){let e=this.player,i=e.stats;if(!t?.use)return!1;let n=1+(e.skills?.healing||0),s=t.use;if(s.hunger&&(i.hunger=Z(i.hunger+s.hunger,0,100)),s.thirst&&(i.thirst=Z(i.thirst+s.thirst,0,100)),s.health&&e.heal(s.health*n),s.stamina&&(e.stamina=Z(e.stamina+s.stamina,0,e.staminaMax)),s.stress&&(i.stress=Z(i.stress+s.stress,0,100)),s.radiation&&(i.radiation=Z(i.radiation+s.radiation,0,100)),s.infection&&(i.infection=Z(i.infection+s.infection,0,100),s.infection<0))for(let r of Object.keys(this.body.wounds))this.body.wounds[r].infection=Math.max(0,this.body.wounds[r].infection+s.infection);if(s.bleed){i.bleed=Z(i.bleed+s.bleed,0,100);for(let r of Object.keys(this.body.wounds))this.body.wounds[r].bleed=Z(this.body.wounds[r].bleed+s.bleed/3,0,100)}if(s.fracture){i.fractures.legs=!1,i.fractures.arms=!1;for(let r of Object.keys(this.body.wounds))this.body.wounds[r].fracture=!1}return this.audio.pickup?.(),this.updateObjectives(),!0}itemDef(t){return qe[t]||Me[t]||null}craft(t){let e=xs.find(c=>c.id===t);if(!e)return!1;if((this.nearBenchLevel||0)<e.bench)return this.notify("Bench required","You need a workbench for that."),!1;let n=(this.skills.craftCheap||0)>0&&(e.cat==="Weapons"||e.cat==="Ammunition")?1:0,s=this.inventory;for(let[c,h]of Object.entries(e.in)){let d=Math.max(1,h-n);if(s.count(c)<d)return this.notify("Missing materials","You do not have enough "+(this.itemDef(c)?.name||c)+"."),!1}for(let[c,h]of Object.entries(e.in)){let u=Math.max(1,h-n);for(;u>0;){let f=s.items.find(y=>y.id===c);if(!f)break;let g=Math.min(u,f.qty);s.removeUid(f.uid,g),u-=g}}let[r,o]=e.out,l=s.add(r,o);return l<o&&this.dropLootBag(r,o-l,this.player.pos.x,this.player.pos.y,this.player.pos.z),this.audio.craft?.(),this.ui.notify("Crafted",`${this.itemDef(r)?.name||r} \xD7${o}`,null,"good"),this.quests.onCraft(1),this.ui.panels.refreshAll(),!0}nearBench(){let t=this.player.pos;for(let e of this.buildings)if(e.def.bench&&Math.hypot(e.x-t.x,e.z-t.z)<4.5)return 1;for(let e of this.world.pois)if(e.type==="camp"&&Math.hypot(e.x-t.x,e.z-t.z)<34)return 1;for(let e of this.world.pois)if((e.id==="ind_foundry"||e.id==="ind_power"||e.id==="mil_lab")&&Math.hypot(e.x-t.x,e.z-t.z)<40)return 2;return 0}startBuilding(t){let e=Gs.find(i=>i.id===t);if(e){for(let[i,n]of Object.entries(e.cost))if(this.inventory.count(i)<n){this.notify("Missing materials",this.itemDef(i)?.name||i);return}this.buildMode={def:e,ghost:null},this.mode="building",this.locked=!1,this.buildGhost(),this.ui.notify("Placement","Left click to place, right click or Escape to cancel.",null,"quest"),this.ui.hud.setVisible(!0)}}buildGhost(){if(!this.buildMode||this.headless)return;let t=this.buildMode.def;this.cancelGhost();let e=C(t.size[0],t.size[1],t.size[2],2),i=new At(e,ye(8367730,{transparent:!0,opacity:.38,depthWrite:!1}));i.position.y=t.size[1]/2,this.scene.add(i),this.buildMode.ghost=i}cancelGhost(){this.buildMode?.ghost&&this.scene.remove(this.buildMode.ghost),this.buildMode&&(this.buildMode.ghost=null)}updateBuilding(t){if(!this.buildMode||!this.buildMode.ghost)return;let e=this.player,i=e.flatForward,n=e.pos.x+i.x*3.2,s=e.pos.z+i.z*3.2,r=this.world.heightAt(n,s),o=this.buildMode.ghost;o.position.set(n,r,s),o.rotation.y=e.yaw;let l=this.buildMode.def,c=!this.world.colliders.query(n-l.size[0]/2,s-l.size[2]/2,n+l.size[0]/2,s+l.size[2]/2).some(h=>h.tag!=="road"&&h.tag!=="floor");o.material.color.setHex(c?9420658:12606026),this.buildValid=c,this.buildPos={x:n,y:r,z:s},!this.headless&&this.input.mouse&&(this.input.mouse.leftPressed&&this.placeBuilding(),(this.input.mouse.rightPressed||this.input.pressed?.Escape)&&this.cancelBuilding())}placeBuilding(){if(!this.buildMode||!this.buildValid){this.notify("Cannot build there");return}let t=this.buildMode.def,e=this.inventory;if(!Object.entries(t.cost).every(([l,c])=>e.count(l)>=c)){this.cancelBuilding();return}for(let[l,c]of Object.entries(t.cost)){let h=c;for(;h>0;){let d=e.items.find(f=>f.id===l);if(!d)break;let u=Math.min(h,d.qty);e.removeUid(d.uid,u),h-=u}}let{x:i,y:n,z:s}=this.buildPos,r=new At(C(t.size[0],t.size[1],t.size[2],2),t.cat==="Defense"?E.woodWeathered:t.cat==="Utility"?E.metalPaint:E.wood);if(r.position.set(i,n+t.size[1]/2,s),r.rotation.y=this.player.yaw,r.castShadow=!0,r.receiveShadow=!0,this.scene.add(r),this.world.colliders.addBox(i-t.size[0]/2,n,s-t.size[2]/2,i+t.size[0]/2,n+t.size[1],s+t.size[2]/2,t.cat==="Structure"?"wall":"prop"),t.light){let l=new Ke(16756832,3.2,9,2);l.position.set(i,n+t.size[1]+.3,s),this.scene.add(l)}let o=Math.round(t.hp*(1+(this.skills.buildHp||0)));this.buildings.push({def:t,x:i,y:n,z:s,mesh:r,hp:o,ry:this.player.yaw}),this.buildCount++,this.quests.onBuild(1),this.audio.craft?.(),this.ui.notify("Built",t.name,null,"good"),this.cancelBuilding(),this.saveGame(!1)}cancelBuilding(){this.cancelGhost(),this.buildMode=null,this.mode="playing",this.headless||this.requestLock()}spawnInteractables(){this.interactables=[];for(let t of h1){let e,i,n;if(t.poi){let r=this.world.pois.find(o=>o.id===t.poi);if(!r)continue;e=r.x+(t.dx||0),i=r.z+(t.dz||0)}else e=t.x,i=t.z;n=this.world.heightAt(e,i);let s=this.buildInteractableMesh(t.kind);s.position.set(e,n,i),s.rotation.y=Math.random()*Math.PI,this.scene.add(s),this.interactables.push({...t,x:e,y:n,z:i,mesh:s,used:!1})}}buildInteractableMesh(t){let e=new Kt,i=(n,s,r,o,l,c=0)=>{let h=new At(n,s);return h.position.set(r,o,l),h.rotation.y=c,h.castShadow=!0,h.receiveShadow=!0,e.add(h),h};if(t==="locker")i(C(.9,1.9,.5),E.metalPaint,0,.95,0),i(C(.04,1.7,.02),E.rust,0,.95,.26);else if(t==="console"||t==="array")i(C(1.6,1.1,.7),E.metalPaint,0,.55,0),i(C(1.2,.55,.05),vt("screen",{emissive:t==="array"?10115792:5635994,emissiveIntensity:2.4}),0,1,.36),i(C(.5,.1,.4),E.steel,.3,1.32,.1);else if(t==="note")i(C(.03,.32,.24),vt("paper",{color:14209208}),0,1.3,0);else if(t==="valve"){i(rt(.09,.09,1.1,8),E.rust,0,.55,0);let n=i(rt(.42,.42,.08,12),E.rust,0,1.12,0);n.rotation.x=Math.PI/2;for(let s=0;s<3;s++){let r=i(C(.76,.05,.06),E.rust,0,1.12,0);r.rotation.z=s/3*Math.PI}}else if(t==="projector"){i(C(.5,.34,.6),E.metalPaint,0,1.3,0),i(rt(.1,.12,.22,8),E.steel,0,1.3,.35).rotation.x=Math.PI/2;let n=i(rt(.16,.9,4.2,10,2,!0),new Ce({color:14674128,transparent:!0,opacity:.055,depthWrite:!1,side:_e}),0,1.3,2.4);n.rotation.x=Math.PI/2}else if(t==="breaker")i(C(.9,1.2,.35),E.metalPaint,0,.7,0),i(C(.7,.9,.06),vt("hazard",{color:14729312}),0,.72,.2);else if(t==="barricade")for(let n=0;n<3;n++){let s=i(C(2.4,.28,.2),E.woodWeathered,0,1.15+n*.34,0);s.rotation.z=.12*(n%2?1:-1)}else if(t==="lamp"){i(rt(.07,.09,3.2,8),E.rust,0,1.6,0),i(C(.42,.24,.42),E.metalPaint,0,3.1,0);let n=new Ke(16760944,0,12,2);n.position.set(0,3.05,0),e.add(n),e.userData.lamp=n}else if(t==="wire"){for(let n=0;n<5;n++){let s=i(rt(.05,.05,1.5,6),E.steel,-2.4+n*1.2,.75,0)}i(C(5,.02,.02),E.steel,0,1.35,0)}return e}tryInteract(){if(this.mode!=="playing")return;let t=this.player;if(this.npcs.nearest){this.npcs.open(this.npcs.nearest);return}let e=null,i=3;for(let s of this.interactables){let r=Math.hypot(s.x-t.pos.x,s.z-t.pos.z);r<i&&Math.abs(s.y-t.pos.y)<3&&(e=s,i=r)}if(e){this.useInteractable(e);return}let n=this.doors.nearest(t.pos,2.6);if(n){this.doors.toggle(n);return}this.loot.interact()}useInteractable(t){let e=this.quests,i=this.player;if(this.audio.uiClick(),e.onInteract(t.id),t.id==="shelter_note")this.ui.notify("MIKHAIL'S NOTE",'"The array is still transmitting. If you are reading this, I did not come back. Take the stairs, take the rifle if it is still there. Do not answer the radio. \u2014 M."',"#c8b48c","quest");else if(t.id==="shelter_console")this.ui.notify("RADIO CONSOLE","A voice in your brother's cadence counts down from fourteen point seven. It repeats. It has been repeating for six years.","#c9963f","quest"),this.audio.radioStatic?.();else if(t.id==="shelter_locker"){let n=this.loot.nearby(new P(t.x,t.y,t.z),3.2);n.length?this.loot.open(n[0].spot):this.ui.notify("Locker","Empty. Somebody cleared it before the lights went out.")}else if(t.id==="school_valve")this.ui.notify("WATER VALVE","The pipe shudders. Somewhere under the school, water starts moving again.",null,"good");else if(t.id==="projector")this.ui.notify("PROJECTOR","The reel ends. A family on a beach, waving at a camera. Then white.","#c8b48c","quest");else if(t.id==="crane_panel")this.ui.notify("RAIL CRANE","The crane wakes up and screams along its rail. The scrappers will hear that.",null,"good");else if(t.id==="warehouse_breaker")this.ui.notify("BREAKER","Lights stutter on across Warehouse 12. Something in the rafters does not like it.",null,"good"),this.spawnEnemyNear("screamer",8,14);else if(t.id==="hospital_barricade")this.ui.notify("BARRICADE","You wedge the doors shut. The corridor outside goes quiet in a way that is worse than noise.",null,"good");else if(t.id==="delta_lamp"){if(this.inventory.count("battery")<=0){this.ui.notify("Lamp","It needs two battery cells.");return}this.inventory.removeUid(this.inventory.items.find(s=>s.id==="battery").uid,1);let n=t.mesh.userData.lamp;n&&(n.intensity=9),this.ui.notify("PERIMETER LAMP","The lamp comes on. The dark moves back four metres.",null,"good")}else t.id==="perimeter_cut"?(this.ui.notify("PERIMETER WIRE","You cut the wire. A gap opens in the exclusion wall.",null,"good"),this.alertEnemiesToNoise(t.x,t.z,.7,30)):t.id==="array_console"&&(this.ui.notify("ARRAY CONSOLE","Eight pylons. One core socket. It is warm, and it is humming your name.","#c9963f","quest"),this.startFinale());t.id!=="shelter_locker"&&(t.used=!0)}updatePOIs(t){let e=this.player.pos,i=this.world.heightAt(e.x,e.z);if(!(e.y<i-2.5)){for(let n of this.world.pois){let s=Math.hypot(e.x-n.x,e.z-n.z);s<34&&!n.discovered?(n.discovered=!0,this.codex.regions[this.world.regionAt(n.x,n.z).id]=!0,this.quests.onReach(n.id),(n.type!=="shelter"||n.id==="shelter12")&&this.ui.notify("Location discovered",n.name,"#c9963f","quest"),this.audio.discovery?.()):s<22&&this.quests.onReach(n.id)}this.waypoint&&Math.hypot(e.x-this.waypoint.x,e.z-this.waypoint.z)<6&&(this.ui.notify("Waypoint reached","",null,"good"),this.waypoint=null)}}setWaypoint(t,e){this.waypoint={x:t,z:e},this.audio.uiClick()}updateObjectives(){let t=this.quests.trackedObjectives?this.quests.trackedObjectives():[];if(this.objectives=t.map(e=>({text:e.text,done:e.done,cur:e.cur,max:e.max})),!this.objectives.length&&this.quests){let e=this.quests.nextAvailableMain();e&&!this.quests.isActive(e.id)&&(this.objectives=[{text:e.name+" \u2014 speak to "+(e.giver||"the camp"),done:!1,cur:0,max:1}])}}onHitEnemy(t,e,i){this.stats.damageDealt+=e,i&&this.stats.headshots++,this.settings.showDamage&&this.ui.hud.toast("",""),this.ui.hud.hitMarker(i),!t.dead&&i&&Math.random()<.35&&t.setState?.("stagger")}onEnemyAggro(t){this.codex.mutants[t.type]!=="seen"&&(this.codex.mutants[t.type]=!0)}onEnemyKilled(t,e={}){this.stats.kills++,this.codex.kills[t.type]=(this.codex.kills[t.type]||0)+1,this.quests.onKill(t.type),this.giveXP((Ti[t.type]?.xp||40)*(t.isBoss?4:1),"kill"),this.loot.enemyDrop(t),t.isBoss&&(this.codex.bosses[t.bossId]=!0,this.quests.onBoss(t.bossId),this.bossBars.delete(t),this.ui.hud.hideBoss(),this.vfx.spawnShockwave(t.pos,18,16777215),this.audio.bossDeath?.(),this.ui.notify("ASSET TERMINATED",t.name,"#e0b463","good"),this.act=Math.min(8,Math.max(this.act,this.questForBoss(t.bossId)+1)),this.saveGame(!1)),this.updateObjectives()}onBossPhase(t){this.ui.hud.showBoss(t.name,t.phase,t.maxPhases,t.phaseText&&t.phaseText[t.phase-1]||""),this.ui.notify(t.name,t.phaseText?t.phaseText[t.phase-1]:"It changes.","#c05038","danger"),this.player.addShake(.7)}onPlayerHurt(t){t>0&&this.ui.flashDamage(Z(t/28,.2,1))}restAtCamp(t){let e=this.sky;e.dayTime=.27,this.day++,this.player.stats.fatigue=Math.max(0,this.player.stats.fatigue-55),this.player.stats.stress=Math.max(0,this.player.stats.stress-25),this.player.heal(45),this.player.stamina=this.player.staminaMax;for(let i of Object.keys(this.body.wounds))this.body.wounds[i].bleed=Math.max(0,this.body.wounds[i].bleed-30),this.body.condition[i]=Z(this.body.condition[i]+18,0,100);this.body.syncPlayerBleed(),this.ui.notify("RESTED",`You sleep until dawn at ${t.def.name}'s camp. Day ${this.day}.`,"#c9963f","good"),this.saveGame(!1)}startFinale(){this.finaleStarted||(this.finaleStarted=!0,this.act=8,this.sky.setWeather("radstorm",!1),this.audio.bossRoar(this.player.pos),this.ui.notify("THE ARRAY WAKES","Every pylon turns inward. The signal is not a recording. It is listening.","#c05038","danger"),this.spawnEnemyNear("watcher",25,40),this.spawnEnemyNear("watcher",25,40),this.spawnEnemyNear("pale",30,45),this.arenaBossSpawn("last_signal"))}arenaBossSpawn(t){let e=zn[t];if(!e||this.codex.bosses[t])return;let i=this.world.arenas[e.arena];if(!i||i._spawned)return;i._spawned=!0;let n=new Qs(this,t);this.enemies.push(n),this.bosses.push(n),this.codex.bossSeen[t]=!0,this.bossBars.set(n,!0),this.ui.hud.showBoss(n.name,n.phase,n.maxPhases,"THE LAST SIGNAL")}onFinale(){this.mode="ended",this.ui.hud.hideBoss(),this.audio.stopMusic?.(),this.audio.startMusic?.("ending"),this.ui.notify("LAST SIGNAL","The silence afterwards is the loudest thing you have ever heard. Then, quietly, the radio clicks on again.","#e0b463","quest"),this.saveGame(!1)}selectQuickSlot(t){let i=this.inventory.quickSlots?.[t];if(this.selectedQuick=t,!i)return;let n=this.itemDef(i);if(n&&(n.use||n.cat==="food"||n.cat==="water"||n.cat==="medicine")){let s=this.inventory.items.find(r=>r.id===i);s&&this.inventory.useItem(s.uid)}else Me[i]&&(this.weapons.setWeapon(i),this.ui.updateWeapon())}toggleAimWeapon(){let t=this.inventory.equipment,e=this.weapons.isMelee?t.weapon1?.id||t.weapon2?.id:t.melee?.id||t.weapon2?.id;e&&(this.weapons.setWeapon(e),this.ui.updateWeapon(),this.audio.uiClick())}quickHeal(){let t=["medkit","bandage","painkillers","stim_combat"];for(let e of t){let i=this.inventory.items.find(n=>n.id===e);if(i){if(e==="bandage"){let n="torso",s=0;for(let[r,o]of Object.entries(this.body.wounds))o.bleed>s&&(s=o.bleed,n=r);this.body.treat(n,"bandage")}else this.inventory.useItem(i.uid);return}}this.notify("No medical supplies","Search another building.")}notify(t,e="",i=null,n=""){this.ui&&this.ui.notify(t,e,i,n)}debugPick(t,e){let i=new fa;return i.setFromCamera(new Xt(t,e),this.camera),i.intersectObjects(this.scene.children,!0).slice(0,6).map(s=>({d:+s.distance.toFixed(1),name:s.object.name||"",type:s.object.type,geo:s.object.geometry?.type||"",mat:s.object.material?.type||"",color:s.object.material?.color?s.object.material.color.getHexString():"",parent:s.object.parent?.name||"",tris:s.object.geometry?.index?s.object.geometry.index.count/3:(s.object.geometry?.attributes?.position?.count||0)/3}))}startLoop(){let t=performance.now(),e=0,i=n=>{this._raf=requestAnimationFrame(i);let s=(n-t)/1e3;if(t=n,s>.1&&(s=.1),s<=0)return;e+=s;let r=0;for(;e>1/120&&r++<6;)this.step(1/120),e-=1/120;this.renderer&&!this.freezeRender&&this.renderer.render(this.scene,this.camera)};this._raf=requestAnimationFrame(i)}step(t){let e=this;if(e.mode!=="loading"){if(e.hitStop>0&&(e.hitStop-=t,t*=.15),e.mode==="paused"||e.mode==="menu"||e.mode==="dead"||e.mode==="loading"){if(e.sky&&e.player&&(e.sky.update(t*.25,e.camera,e.sun,e.hemi,e.scene,e.player.pos),e.mode==="menu")){let i=performance.now()*6e-5;e.camera.position.set(e.player.pos.x+Math.cos(i)*22,e.player.pos.y+9,e.player.pos.z+Math.sin(i)*22),e.camera.lookAt(e.player.pos.x,e.player.pos.y+1.5,e.player.pos.z)}e.mode==="dead"&&e.ui.update(t),e.audio&&e.audio.update(t);return}if(e.mode==="playing"||e.mode==="dialogue"||e.mode==="shop"||e.mode==="panel"){e.time+=t;let i=e.input.keys,n=e.input.mouse,s=e.ui.isBlockingInput();e.updateGamepad(t),e.mode==="playing"&&!s?(e.player.input(i,n,e),e.player.update(t,i,e),e.player.updateSurvival(t,e.envInfo()),e.body.update(t),e.weapons.update(t,i,n),e.combat.update(t),e.player.slowT>0&&(e.player.slowT-=t,e.player.vel.x*=.55,e.player.vel.z*=.55)):e.mode==="playing"&&(e.player.updateSurvival(t,e.envInfo()),e.body.update(t),e.combat.update(t));let r=e.player.pos;for(let o of e.enemies){let l=(o.pos.x-r.x)**2+(o.pos.z-r.z)**2;if(!(l>190*190)){if(l>90*90&&!o.isBoss&&o.state==="idle"){Math.random()<.02&&o.update(t);continue}o.update(t)}}for(let o=e.enemies.length-1;o>=0;o--){let l=e.enemies[o];l.dead&&l.deadTime>30&&e.removeEnemy(l)}e.doors.update(t),e.npcs.update(t),e.loot.update(t),e.events.update(t),e.quests.update(t),e.updateArenas(t),e.updatePOIs(t),e.updateBuilding(t),e.updateHazardClouds(t),e.mode==="playing"&&e.checkInteractPrompt(),e.nearBenchLevel=e.nearBench(),e.sky.update(t,e.camera,e.sun,e.hemi,e.scene,r),e.applyIndoorLight(),e.world.update(t,r),e.vfx.update(t),e.updateFlashlight(),e.updateSignal(t),e.ui.update(t),e.audio.setListener?.(e.camera),e.audio.update(t),e.updateObjectives(),e.autosaveTimer+=t,e.autosaveTimer>240&&(e.autosaveTimer=0,e.saveGame(!0)),e.player.dead&&e.mode!=="dead"&&e.onPlayerDeath()}e.mode==="building"&&(e.player.update(t,e.input.keys,e),e.updateBuilding(t),e.sky.update(t,e.camera,e.sun,e.hemi,e.scene,e.player.pos),e.ui.update(t),e.input.pressed?.Escape&&e.cancelBuilding()),e.input.mouse.dx=0,e.input.mouse.dy=0,e.input.mouse.leftPressed=!1,e.input.mouse.rightPressed=!1,e.input.pressed={}}}updateGamepad(t){if(this.headless||typeof navigator>"u"||!navigator.getGamepads)return;let e=navigator.getGamepads(),i=e&&[...e].find(r=>r&&r.connected);if(!i)return;let n=this.settings.gamepadSens,s=r=>Math.abs(r)<.16?0:r;this.input.keys.KeyW=s(i.axes[1])<-.2,this.input.keys.KeyS=s(i.axes[1])>.2,this.input.keys.KeyA=s(i.axes[0])<-.2,this.input.keys.KeyD=s(i.axes[0])>.2,this.input.keys.ShiftLeft=!!i.buttons[10]?.pressed||!!i.buttons[4]?.pressed,this.input.keys.Space=!!i.buttons[0]?.pressed,this.input.mouse.dx+=s(i.axes[2])*14*n,this.input.mouse.dy+=s(i.axes[3])*14*n,this.input.mouse.left=!!i.buttons[7]?.pressed,this.input.mouse.right=!!i.buttons[6]?.pressed,i.buttons[2]?.pressed&&!this._padX&&(this.input.pressed.KeyE=!0,this.onKeyDown("KeyE"),this._padX=!0),i.buttons[2]?.pressed||(this._padX=!1),i.buttons[1]?.pressed&&!this._padC&&(this.input.keys.KeyC=!0,this._padC=!0),i.buttons[1]?.pressed||(this.input.keys.KeyC=!1,this._padC=!1),i.buttons[3]?.pressed&&!this._padR&&(this.weapons.reload(),this._padR=!0),i.buttons[3]?.pressed||(this._padR=!1)}envInfo(){let t=this.sky,e=this.world.regionAt(this.player.pos.x,this.player.pos.z),i=0;for(let o of this.enemies)!o.dead&&Math.hypot(o.pos.x-this.player.pos.x,o.pos.z-this.player.pos.z)<20&&i++;let n=t.hour;return{temperature:(e.id==="wasteland"?26:e.id==="forest"?8:e.id==="military"?10:e.id==="city"?12:14)+Math.sin((n-8)/24*Math.PI*2)*7+t.weatherBlend.rain*-5,night:t.isNight,nearbyEnemies:i,indoor:this.world.isIndoor(this.player.pos.x,this.player.pos.y+1,this.player.pos.z),region:e}}updateHazardClouds(t){if(this.hazardClouds)for(let e=this.hazardClouds.length-1;e>=0;e--){let i=this.hazardClouds[e];if(i.t+=t,i.t>i.life){this.hazardClouds.splice(e,1);continue}let n=this.player;!n.dead&&Math.hypot(n.pos.x-i.x,n.pos.z-i.z)<i.r&&(n.stats.radiation=Z(n.stats.radiation+t*3.4,0,100),n.stats.health>1&&(n.stats.health-=t*.6))}}applyIndoorLight(){let t=this.player.pos,e=this.world.isIndoor(t.x,t.y+1.2,t.z);this.indoor=e,e&&(this.sun&&(this.sun.intensity*=.34),this.hemi.intensity=Math.max(this.hemi.intensity,.55),this.hemi.color.setHex(7832207),this.hemi.groundColor.setHex(3155998))}updateFlashlight(){if(!this.flashlight)return;let t=this.player,e=t.eyePos,i=t.forward;this.flashlight.position.copy(e),this.flashlight.target.position.copy(e).addScaledVector(i,18),this.lantern&&this.lantern.position.copy(e).addScaledVector(t.flatForward,.6).add(new P(0,-.35,0));let n=t.flashlightOn&&t.flashlightBattery>0&&!t.dead,s=t.flashlightBattery<18?.6+Math.random()*.4:1;if(this.flashlight.intensity=n?7.5*s:0,t.flashlightOn&&t.flashlightBattery<=0&&(this.notify("Flashlight dead","You need a battery cell."),t.flashlightOn=!1,this.inventory.count("battery")>0)){let r=this.inventory.items.find(o=>o.id==="battery");this.inventory.removeUid(r.uid,1),t.flashlightBattery=100,t.flashlightOn=!0,this.notify("Battery replaced","",null,"good")}}updateSignal(t){if(!this.signalEntity)return;let e=performance.now()*.001;this.signalEntity.rotation.y=e*.1;let i=this.signalEntity.userData.mat;i&&(i.opacity=.3+Math.sin(e*1.6)*.09),this.signalLight&&(this.signalLight.intensity=4+Math.sin(e*2.1)*1.6);let n=this.player.pos,s=this.world.pois.find(r=>r.id==="was_array");if(s&&!this.quests.flags.signalSpoke&&Math.hypot(n.x-s.x,n.z-s.z)<7){this.quests.flags.signalSpoke=!0,this.quests.onTalk("signal");let r=Ia.signal;this.ui.openDialogue(r.name,r.role),this.npcs.dialogue={npc:{def:r,ghost:!0},nodeId:"start",node:null,open:!0},this.npcs.enter("start")}}checkInteractPrompt(){this._interactCooldown>0&&(this._interactCooldown-=.016);let t=this.player.pos;if(this.npcs.nearest)return;let e=null;for(let i of this.interactables)if(!i.used&&Math.hypot(i.x-t.x,i.z-t.z)<2.8&&Math.abs(i.y-t.y)<2.6){e=i.label;break}if(!e){let i=this.doors.nearest(t,2.4);i&&(e=i.angle>.5?"Close the door":"Open the door")}if(!e){let i=this.loot.nearby(t,2.2);i.length&&(e="Search the "+(i[0].spot.kind==="locker"?"locker":i[0].spot.kind==="bag"?"bag":i[0].spot.kind==="corpse"?"body":"container"))}e?this.ui.setPrompt(`[E]  ${e}`):this.ui.promptVisible()&&this.ui.setPrompt(null)}loadSettings(){try{let t=typeof localStorage<"u"&&localStorage.getItem("aohl_settings");t&&Object.assign(this.settings,JSON.parse(t))}catch{}this.difficulty=this.settings.difficulty==="story"?.7:this.settings.difficulty==="ashes"?1.35:1}saveSettings(){try{localStorage.setItem("aohl_settings",JSON.stringify(this.settings))}catch{}}applySettings(){let t=this.settings;this.difficulty=t.difficulty==="story"?.7:t.difficulty==="ashes"?1.35:1,this.renderer&&(this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)*t.renderScale),this.renderer.shadowMap.enabled=t.shadows,this.renderer.toneMappingExposure=1.12*t.brightness,this.scene.fog=this.scene.fog||null,this.sun.castShadow=t.shadows),this.camera&&(this.camera.far=900+t.viewDistance*700,this.camera.updateProjectionMatrix()),this.player&&(this.player.fov=t.fov,this.player.sens=t.sensitivity),this.audio&&(this.audio.setVolume?.(t.master),this.audio.setMusicVolume?.(t.music)),this.ui.applySettings(),this.saveSettings()}serialize(){let t=this.player;return{version:2,savedAt:Date.now(),seed:this.seed,player:{pos:[t.pos.x,t.pos.y,t.pos.z],yaw:t.yaw,pitch:t.pitch,stats:t.stats,stamina:t.stamina,flashlightOn:t.flashlightOn,battery:t.flashlightBattery},progression:{level:this.level,xp:this.xp,points:this.skillPoints,skills:this.skillRanks},body:this.body.serialize(),inventory:this.inventory.serialize(),quests:this.quests.serialize(),codex:this.codex,stats:this.stats,time:this.time,day:this.day,act:this.act,sky:{dayTime:this.sky.dayTime,weather:this.sky.weatherTarget},settings:this.settings,loot:this.loot.serialize(),doors:this.doors.serialize(),events:this.events.serialize(),pois:this.world.pois.map(e=>[e.id,!!e.discovered]),buildings:this.buildings.map(e=>({id:e.def.id,x:e.x,y:e.y,z:e.z,ry:e.ry})),enemies:this.enemies.filter(e=>!e.isBoss).map(e=>[e.type,e.pos.x,e.pos.z]),bosses:this.codex.bosses,waypoint:this.waypoint,finaleStarted:this.finaleStarted}}saveGame(t=!1){let e=Cd(this.serialize(),!t);return t&&e?this.ui.notify("Progress saved","The shelter terminal has a copy of your journal.",null,"good"):t&&!this._saveWarned&&(this._saveWarned=!0,this.ui.notify("Saves unavailable","This browser blocks local storage for files opened from disk. Serve the folder over HTTP for persistent saves.",null,"danger")),e}loadData(t){if(!t)return!1;let e=this.player;e.pos.set(t.player.pos[0],t.player.pos[1],t.player.pos[2]),e.vel.set(0,0,0),e.yaw=t.player.yaw,e.pitch=t.player.pitch||0,Object.assign(e.stats,t.player.stats||{}),e.stamina=t.player.stamina??e.staminaMax,e.flashlightOn=t.player.flashlightOn??!0,e.flashlightBattery=t.player.battery??100;let i=t.progression||{};if(this.level=i.level||1,this.xp=i.xp||0,this.skillPoints=i.points||0,this.skillRanks=i.skills||{},this.skills={},this.applySkills(),this.body.deserialize(t.body),this.inventory.deserialize(t.inventory),this.quests.deserialize(t.quests),this.codex=t.codex||this.codex,this.stats=t.stats||this.stats,this.time=t.time||0,this.day=t.day||1,this.act=t.act||1,t.sky&&(this.sky.dayTime=t.sky.dayTime,this.sky.setWeather(t.sky.weather||"overcast",!0)),Object.assign(this.settings,t.settings||{}),this.loot.deserialize(t.loot),this.doors.deserialize(t.doors),this.events.deserialize(t.events),t.pois)for(let[n,s]of t.pois){let r=this.world.pois.find(o=>o.id===n);r&&(r.discovered=s)}for(let n of t.buildings||[])this.restoreBuilding(n);this.waypoint=t.waypoint||null,this.finaleStarted=!!t.finaleStarted,this.clearEnemies();for(let[n,s,r]of t.enemies||[])this.spawnEnemy(n,s,r);return this.codex.bosses=this.codex.bosses||{},this.ui.updateWeapon(),this.ui.notify("Loaded",`Day ${this.day} \u2014 level ${this.level}.`,null,"good"),!0}restoreBuilding(t){let e=Gs.find(n=>n.id===t.id);if(!e)return;let i=new At(C(e.size[0],e.size[1],e.size[2],2),E.wood);i.position.set(t.x,t.y+e.size[1]/2,t.z),i.rotation.y=t.ry,this.scene.add(i),this.buildings.push({def:e,x:t.x,y:t.y,z:t.z,mesh:i,hp:e.hp,ry:t.ry}),this.buildCount++}loadGame(){let t=or(!1)||or(!0);return t?(this.loadData(t),this.mode="playing",this.locked=!1,this.headless||this.requestLock(),!0):(this.notify("No save found"),!1)}hasSave(){return $a()}dispose(){this._raf&&cancelAnimationFrame(this._raf)}};var sn=document.getElementById("boot");function Pd(a){console.error(a),sn&&(sn.classList.add("error"),sn.innerHTML=`<h1>UNABLE TO START</h1>
    <p style="max-width:520px;text-align:center;line-height:2;letter-spacing:.08em">
      ${a&&a.message?String(a.message).replace(/[<>]/g,""):"The renderer could not be created."}<br>
      This game needs WebGL2. Try a current version of Chrome, Edge or Firefox with hardware acceleration enabled.
    </p>`)}async function u1(){if(!document.createElement("canvas").getContext("webgl2")){Pd(new Error("WebGL2 is not available in this browser."));return}let e=new URLSearchParams(location.search),i=new Ya({container:document.body,lite:e.get("lite")==="1"});window.game=i;try{await i.init((n,s)=>{if(sn&&sn.firstElementChild){let r=sn.querySelector("p");r&&(r.textContent=String(n).toUpperCase()+" \xB7 "+Math.round(s)+"%")}})}catch(n){Pd(n);return}sn&&(sn.style.opacity="0",setTimeout(()=>sn.remove(),700)),window.addEventListener("click",()=>{i.mode==="playing"&&!i.locked&&i.requestLock()},{once:!1})}u1();
