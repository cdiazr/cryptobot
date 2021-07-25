/**
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 * crypto
 * @authors 
 *      Roberto Schaerer <roberto@sysmovil.com>
 * @descripción: 
 * @version 1.0 - 25 jul. 2021 - 11:24:15
 * 
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

var contenido = false;
var menu = false;
var divPing = {};
var divTime = {};
var divExInfo = {};
var portCount = 8001;

$(document).ready(function () {

    contenido = $('#contenido');
    menu = $('.menu');

    menu.css({
        'height' : $(document).height()
    });

    Manager.init();

    $('.subscriber').click(function () {

       var divId = Manager.getDivId($(this));
       var divTitulo = Manager.getTituloDiv($(this));
       var creatorName = Manager.getCreatorName($(this));

       if ( $(this).is(':checked') ) {
           Manager.pre_iniciar(Manager.getStream($(this)), 
           function (payload, area) {
              Creator.init_div(divId);
              Creator[divId] = Creator.create_div( Creator[divId], divTitulo );
              Creator[creatorName].call(this, Creator[divId], payload );
           }, true);
       }

    });

    $('.infoapi').click(function () {

       var divId = Manager.getDivId($(this));
       var divTitulo = Manager.getTituloDiv($(this));
       var creatorName = Manager.getCreatorName($(this));
       var filterName = Manager.getFilterName($(this));
       var query = QueryFilter[filterName] ? 
            QueryFilter[filterName].call() : null;
       var signed = $(this).data('signed');

       if ( $(this).is(':checked') ) {
           Manager.pre_iniciar( Manager.getAreaUrl($(this) ), 
           function (payload, area) {
              Creator.init_div(divId);
              Creator[divId] = Creator.create_div( Creator[divId], divTitulo, divId );
              Creator[creatorName].call(this, Creator[divId], payload );
           }, 2, query, signed);
       } else {
           Creator.remove_div(divId);
       }

    });

   window.onresize = function () {
        menu.css({
            'height' : $(document).height()
        });                   
   };


    var ovc = new Ov($('#ov1'), {
        onCompra : function () { 
            var dfd = new $.Deferred();
            dfd.resolve();
            return dfd.promise();
        },
        onVenta : function () { 
            var dfd = new $.Deferred();
            dfd.resolve();
            return dfd.promise();
        }
    });                        

}); // doc ready