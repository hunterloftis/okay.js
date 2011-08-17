// Okay.JS
// by Hunter Loftis <hunter@hunterloftis.com>
//
// Version 0.1.0
window.ok=window.ok||{};
(function(b,d){var a,c,e;function f(){var c=d.uniq(i.pop());i.length===0&&(h=!1);j=d(i).last();return c}function g(b){b._subscriptions=[];b.subscribe=a;b.publish=c;b.unsubscribe=e;b.__isSubscribable=!0}b.dom={};b.template={};b.binding={};b.debug={};var h=!1,i=[],j=null,k={};a=function(c,a){this._subscriptions.push({callback:c,context:a||this});c._publishers=c._publishers||[];d(c._publishers).contains(this)||c._publishers.push(this)};c=function(c){d(this._subscriptions).each(function(a){a.callback.call(a.context,c)},
this)};e=function(c){this._subscriptions=d(this._subscriptions).reject(function(a){return a.callback===c});c._publishers=d(c._publishers).without(this)};b.base=function(c){function a(){if(arguments.length>0)return e!==arguments[0]&&(e=arguments[0],a.publish(e)),this;h&&j.push(a);return e}var e=c;g(a);return a};b.collection=function(c){function a(){if(arguments.length>0)return b=arguments[0],a.publish(b),this;h&&j.push(a);return b}function e(c){return function(){typeof b==="undefined"&&(b=[]);var e=
b[c].apply(b,arguments);a.publish(b);return e}}var b=c;d("pop,push,reverse,shift,sort,splice,unshift".split(",")).each(function(c){a[c]=e(c)});g(a);return a};b.dependent=function(c,a){function e(){h&&j.push(e);return k}function b(){var g=b._publishers?b._publishers.slice():[],m;h=!0;j=[];i.push(j);k=c.call(a);m=f();var n=d(g).select(function(c){return!d(m).contains(c)}),o=d(m).select(function(c){return!d(g).contains(c)});d(n).each(function(c){c.unsubscribe(b)});d(o).each(function(c){c.subscribe(b)});
e.publish(k)}var k;g(e);b();return e};b.dep=function(c,a){var e=new Function("return "+c);return b.dependent(e,a)};b.bind=function(c,a,e){var a=a||"",f="data-bind"+(a.length>0?"-"+a:""),g="data-watch"+(a.length>0?"-"+a:""),h=b.dom.nodesWithAttr(f,e),i=k[a]=[];d(h).each(function(a){var e=b.dom.attr(a,f);with(c)eval("var bindingObject = {"+e+"}");d.each(bindingObject,function(e,d){var f=b.binding[d](a,e,c,!1);f instanceof Array?i.concat(f):i.push(f)})});a=b.dom.nodesWithAttr(g,e);d(a).each(function(a){var e=
b.dom.attr(a,g);with(c)eval("var bindingObject = {"+e+"}");d.each(bindingObject,function(e,d){var f=b.binding[d](a,e,c,!0);f instanceof Array?i.concat(f):i.push(f)})});return i};b.unbind=function(c){var c=c||"",a=k[c];if(a)d(a).each(function(c){c.release()}),k[c]=[];else throw Error("Nothing is bound to namespace '"+c+"'");};b.safeSubscribe=function(c,a,e){c.subscribe?(c.subscribe(a,e),a.call(e,c())):a.call(e,c)}})(window.ok,window._);
(function(b){(b.utils={}).toJSON=function a(c){if(typeof c==="function"){if(c.__isSubscribable)return a(c())}else if(typeof c==="object"){var e;e=c instanceof Array?[]:{};for(var b in c)e[b]=a(c[b]);return e}else return c}})(ok,_);
(function(b,d){var a=b.dom;a.nodesWithAttr=function(c,a){var b="*["+c+"]";if(a){var g=d(a).find("*["+c+"]");return d(a).is(b)?d(a).add(g):g}return d(b)};a.createNode=function(c){return d(c)};a.append=function(c,a){d(c).append(a)};a.remove=function(c){d(c).remove()};a.after=function(c,a){d(c).after(a)};a.before=function(c,a){d(c).before(a)};a.attr=function(a,e){return d(a).attr(e)};a.show=function(a){d(a).show()};a.hide=function(a){d(a).hide()};a.text=function(a,e){d(a).html(e)};a.html=function(a,
e){return d(a).html(e)};a.value=function(a,e){return d(a).val(e)};a.bind=function(a,e,b,g){var h=function(){b.call(g)};d(a).bind(e,h);return h};a.unbind=function(a,e,b){d(a).unbind(e,b)};a.attribute=function(a,b,f){return d(a).attr(b,f)};a.removeAttribute=function(a,b){d(a).removeAttr(b)};a.is=function(a,b){return d(a).is(b)}})(window.ok,window.Zepto);(function(b,d){b.template.render=function(a,c){return d.template(a,c)}})(window.ok,window._);
(function(b){function d(a,c){this.node=a;this.subscribable=c;b.safeSubscribe(c,this.update,this)}d.prototype={update:function(a){a?b.dom.show(this.node):b.dom.hide(this.node)},release:function(){this.subscribable.unsubscribe(this.update)}};b.binding.visible=function(a,c){return new d(a,c)}})(ok);
(function(b){function d(a,c,e,d){this.update=d?_(this._update).debounce(0):this._update;this.node=a;this.subscribable=c;b.safeSubscribe(c,this.update,this)}d.prototype={_update:function(a){b.dom.html(this.node,a)},release:function(){this.subscribable.unsubscribe(this.update)}};b.binding.html=function(a,c,b,f){return new d(a,c,b,f)};b.debug.HtmlBinding=d})(ok);
(function(b){function d(a,c,b){this.node=a;this.callback=c;this.vm=b;$(a).bind("click",_.bind(this.activate,this))}d.prototype={activate:function(a){this.callback.call(this.vm,[a])||(a.preventDefault(),a.stopPropagation())},release:function(){$(node).unbind("click",this.callback)}};b.binding.click=function(a,c,b){return new d(a,c,b)}})(ok);
(function(b){function d(a,c,b){this.node=a;this.callback=c;this.vm=b;$(a).bind("submit",_.bind(this.activate,this))}d.prototype={activate:function(a){this.callback.call(this.vm,[a])||(a.preventDefault(),a.stopPropagation())},release:function(){$(node).unbind("submit",this.callback)}};b.binding.submit=function(a,c,b){return new d(a,c,b)}})(ok);
(function(b){function d(a,c,b){this.node=a;this.callback=c;this.vm=b;$.os.ios||$.os.android||$.os.webos||$.os.touchpad||$.os.iphone||$.os.ipad||$.os.blackberry?($(a).bind("tap",_.bind(this.activate,this)),$(a).bind("touchstart",_.bind(this.btn_down,this)),$(a).bind("touchend",_.bind(this.btn_up,this))):($(a).bind("click",_.bind(this.activate,this)),$(a).bind("mousedown",_.bind(this.btn_down,this)),$(a).bind("mouseup",_.bind(this.btn_up,this)))}d.prototype={activate:function(a){this.callback.call(this.vm,
[a])||(a.preventDefault(),a.stopPropagation())},release:function(){},btn_down:function(){$(this.node).addClass("ok_down")},btn_up:function(){$(this.node).removeClass("ok_down")}};b.binding.tap=function(a,b,e){return new d(a,b,e)}})(ok);
(function(b){function d(a,b){this.node=a;this.subscribable=b;b.subscribe(this.updateNode,this);this.updateNode(b());this.bindNode(a)}function a(a,b){this.node=a;this.subscribable=b;b.subscribe(this.updateNode,this);this.updateNode(b());this.bindNode(a)}d.prototype={bindNode:function(a){this.handler=b.dom.bind(a,"keyup",this.updateSubscribable,this)},updateNode:function(a){b.dom.value(this.node,a)},updateSubscribable:function(){this.subscribable(b.dom.value(this.node))},release:function(){this.subscribable.unsubscribe(this.updateNode);
b.dom.unbind(this.node,"keyup",this.handler)}};a.prototype={bindNode:function(a){this.handler=b.dom.bind(a,"change",this.updateSubscribable,this)},updateNode:function(a){a?b.dom.attribute(this.node,"checked",!0):b.dom.removeAttribute(this.node,"checked")},updateSubscribable:function(){var a=b.dom.is(this.node,":checked")!==!1;console.log("UPDATING WITH VALUE "+a);console.log("("+b.dom.is(this.node,":checked")+")");this.subscribable(a)},release:function(){b.dom.unbind(this.node,"change",this.handler)}};
var c={text:d,checkbox:a};b.binding.value=function(a,d){var g=b.dom.attribute(a,"type");return new (c[g]||c.text)(a,d)}})(ok);
(function(b){function d(a,c,d,f){this.update=f?_(this._update).debounce(0):this._update;this.node=a;this.templateId="#"+c.template;this.subscribable=c.collection;this._items=[];b.dom.html(this.node,"");b.safeSubscribe(this.subscribable,this.update,this)}d.prototype={_update:function(a){var c=this,d=b.dom.html(this.templateId),f=_(this._items).pluck("data"),g,h,i=[];_(a).each(function(a,j){if(c._items.length>j)if(g=c._items[j],g.data===a)i.push(g);else{var l=_(f).indexOf(a);l>=0?(b.dom.before(g.node,
c._items[l].node),i.push(c._items[l])):(h=b.dom.createNode(b.template.render(d,a)),b.dom.before(g.node,h),b.bind(a,null,h),i.push({data:a,node:h}))}else h=b.dom.createNode(b.template.render(d,a)),b.dom.append(c.node,h),b.bind(a,null,h),i.push({data:a,node:h})});var j=[];_(this._items).each(function(b){_(a).contains(b.data)||j.push(b)});_(j).each(function(a){b.dom.remove(a.node)});this._items=i},release:function(){this.subscribable.unsubscribe(this.update)}};b.binding.repeat=function(a,b,e,f){return new d(a,
b,e,f)};b.debug.RepeatBinding=d})(ok);(function(b){function d(a,c,d){this.node=a;this.className=c;this.subscribable=d;b.safeSubscribe(d,this.update,this)}d.prototype={update:function(a){a?$(this.node).addClass(this.className):$(this.node).removeClass(this.className)},release:function(){this.subscribable.unsubscribe(this.update)}};b.binding.css=function(a,b){var e=[],f;for(f in b)e.push(new d(a,f,b[f]));return e}})(ok);
