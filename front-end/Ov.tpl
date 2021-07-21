<div class="ov-cont-sup">
    <div class="ov-cont-tools">
        <select id="slModo">
            <option value="compra">Compra</option>
            <option value="venta">Venta</option>
        </select>
        <select id="slTrade">
            <option value="virtual">VIRTUAL</option>
            <option value="real">REAL</option>
        </select>
        <button id="btnIniciar">Iniciar</button>
        <button id="btnPausar">Pausar</button>
        <button id="btnReconectar">Reconectar</button>
        <label> <input id="chkDepurar" type="checkbox" /> Depurar </label>
        <input type="text" id="txt_time" name="txt_time"  />
    </div>
    <div class="ov-cont-tools">
        <div class="ov-data"></div>

    </div>
    <div class="ov-data-container">
        <div class="ov-data"></div>
        <div class="ov-barra-profit">
            <div class="ov-barra-inc"></div>
        </div>
    </div>
    <div class="ov-barra-precio">

        <div class="ov-des ov-des-precio">
            <div class="ov-ind ov-ind-imp ov-ind-imp-precio">0</div>
            <div class="ov-ind ov-ind-imp ov-ind-imp-venta">0</div>
            <div class="ov-ind ov-ind-imp ov-ind-imp-compra">0</div>                
            <div class="ov-ind ov-ind-imp ov-ind-imp-precio-max">0</div>                
            <div class="ov-ind ov-ind-imp ov-ind-imp-precio-min">0</div>                
        </div>
        <div class="ov-des ov-des-ind">
            <div class="ov-ind ov-ind-graf ov-ind-graf-precio"> <div class="barra-ind"></div> </div>
            <div class="ov-ind ov-ind-graf ov-ind-graf-venta"> <div class="barra-ind"></div> </div>
            <div class="ov-ind ov-ind-graf ov-ind-graf-compra"> <div class="barra-ind"></div> </div>
            <div class="ov-ind ov-ind-graf ov-ind-graf-precio-max"> <div class="barra-ind"></div> </div>
            <div class="ov-ind ov-ind-graf ov-ind-graf-precio-min"> <div class="barra-ind"></div> </div>
        </div>
        <div class="ov-des ov-des-por">
            <div class="ov-ind ov-ind-por ov-ind-por-precio">0</div>
            <div class="ov-ind ov-ind-por ov-ind-por-venta">0</div>
            <div class="ov-ind ov-ind-por ov-ind-por-compra">0</div>                        
            <div class="ov-ind ov-ind-por ov-ind-por-precio-max">0</div>                        
            <div class="ov-ind ov-ind-por ov-ind-por-precio-min">0</div>                        
        </div>
    </div>
    <div class="ov-modo">COMPRA</div>    
</div>
<div class="ov-config"></div>
<div class="ov-log"></div>

<!-- ----------------------------------------------------------------------- -->            

<div id="{idCompra}" class="ov-log-item">
    
    <ul>
        <li>
            <span class="label">Moneda:</span>
            <span class="dato">{moneda}</span>
        </li>
        <li>
            <span class="label">Precio:</span>
            <span class="dato">{precioCompra} / {precioVenta}</span>
        </li>
        <li>
            <span class="label">Cant:</span>
            <span class="dato">{cantCompra} / {cantVenta}</span>
        </li>
        <li>
            <span class="label">Total:</span>
            <span class="dato">{totalCompra} / {totalVenta}</span>
        </li>
    </ul>

    <ul>
        <li>
            <span class="label">FC:</span>
            <span class="dato">{fechaCompra}</span>
        </li>        
        <li>
            <span class="label">% Inc:</span>
            <span class="dato">{porIncCompra} / {porIncVenta}</span>
        </li>
        <li>
            <span class="label">% Margen:</span>
            <span class="dato">{porTotalMargen}</span>
        </li>        
        <li>
            <span class="label">% Descenso:</span>
            <span class="dato">{porDescenso}</span>
        </li>
    </ul>

    <ul>
        <li>
            <span class="label">FV:</span>
            <span class="dato">{fechaVenta}</span>
        </li>        
        <li>
            <span class="label">DO:</span>
            <span class="dato">{fechaDif}</span>
        </li>        
        <li>
            <span class="label">Tipo Venta</span>
            <span class="dato">{tipoVenta}</span>
        </li>        
        <li>
            <span class="label">Margen:</span>
            <span class="dato">{totalMargen}</span>
        </li>        
    </ul>

</div>
    
<!-- ----------------------------------------------------------------------- -->            

<div id="{orderId}" class="ov-log-item">
    
    <ul>
        <li>
            <span class="label">Moneda:</span>
            <span class="dato">{symbol}</span>
        </li>
        <li>
            <span class="label">Precio:</span>
            <span class="dato">{price}</span>
        </li>
        <li>
            <span class="label">Cant. Orig:</span>
            <span class="dato">{origQty}</span>
        </li>
    </ul>

    <ul>
        <li>
            <span class="label">Cant. Ejec.:</span>
            <span class="dato">{executedQty}</span>
        </li>
        <li>
            <span class="label">Estado:</span>
            <span class="dato">{status}</span>
        </li>
        <li>
            <span class="label">Tipo:</span>
            <span class="dato">{type}</span>
        </li>
    </ul>

    <ul>
        <li>
            <span class="label">Oper:</span>
            <span class="dato">{side}</span>
        </li>
    </ul>

</div>
        
<!-- ----------------------------------------------------------------------- -->                    
<!-- ----------------------------------------------------------------------- -->                    
<!-- ----------------------------------------------------------------------- -->                    
<!-- ----------------------------------------------------------------------- -->            

<div class="ov-cont-sup">    <div class="ov-cont-tools">        <select id="slModo">            <option value="compra">Compra</option>            <option value="venta">Venta</option>        </select>        <select id="slTrade">            <option value="virtual">VIRTUAL</option>            <option value="real">REAL</option>        </select>        <button id="btnIniciar">Iniciar</button>        <button id="btnPausar">Pausar</button>        <button id="btnReconectar">Reconectar</button>        <label> <input id="chkDepurar" type="checkbox" /> Depurar </label>        <input type="text" id="txt_time" name="txt_time"  />    </div>    <div class="ov-data-container">        <div class="ov-data"></div>        <div class="ov-barra-profit">            <div class="ov-barra-inc"></div>        </div>    </div>    <div class="ov-barra-precio">        <div class="ov-des ov-des-precio">            <div class="ov-ind ov-ind-imp ov-ind-imp-precio">0</div>            <div class="ov-ind ov-ind-imp ov-ind-imp-venta">0</div>            <div class="ov-ind ov-ind-imp ov-ind-imp-compra">0</div>                            <div class="ov-ind ov-ind-imp ov-ind-imp-precio-max">0</div>                            <div class="ov-ind ov-ind-imp ov-ind-imp-precio-min">0</div>                        </div>        <div class="ov-des ov-des-ind">            <div class="ov-ind ov-ind-graf ov-ind-graf-precio"> <div class="barra-ind"></div> </div>            <div class="ov-ind ov-ind-graf ov-ind-graf-venta"> <div class="barra-ind"></div> </div>            <div class="ov-ind ov-ind-graf ov-ind-graf-compra"> <div class="barra-ind"></div> </div>            <div class="ov-ind ov-ind-graf ov-ind-graf-precio-max"> <div class="barra-ind"></div> </div>            <div class="ov-ind ov-ind-graf ov-ind-graf-precio-min"> <div class="barra-ind"></div> </div>        </div>        <div class="ov-des ov-des-por">            <div class="ov-ind ov-ind-por ov-ind-por-precio">0</div>            <div class="ov-ind ov-ind-por ov-ind-por-venta">0</div>            <div class="ov-ind ov-ind-por ov-ind-por-compra">0</div>                                    <div class="ov-ind ov-ind-por ov-ind-por-precio-max">0</div>                                    <div class="ov-ind ov-ind-por ov-ind-por-precio-min">0</div>                                </div>    </div>    <div class="ov-modo">COMPRA</div>    </div><div class="ov-config"></div><div class="ov-log"></div>