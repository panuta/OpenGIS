
var _data_popup_window;
var _data_popup_window_props;

var _data_popup_windows = {
	show_add: function(layer_id, feature_wkt, callback) {
		if(!_data_popup_window || !_data_popup_window_props) {
			_data_popup_window_props = new Ext.grid.PropertyGrid({
				width: 400,
				border: false,
				autoHeight: false,
				viewConfig : {
					forceFit: true,
					scrollOffset: 2 // the grid will never have scrollbars
				}
			});
			
			_data_popup_window = new Ext.Window({
				layout: 'fit',
				title: 'Data Window',
				width: 350,
				height: 400,
				closeAction: 'hide',
				items: _data_popup_window_props,
				buttons: [{
					text:'Save',
					handler: function(b, e) {
						var _columns_mapping = _data_popup_window_props._columns_mapping;
						
						var savingArray = {layer_id:layer_id, spatial:feature_wkt};
						for(var i=0; i<_data_popup_window_props.store.data.items.length; i++) {
							savingArray[_columns_mapping[_data_popup_window_props.store.data.items[i].data.name]] = _data_popup_window_props.store.data.items[i].data.value;
						}
						
						$.post("/ajax/workspace/insert-layer-data/", savingArray, function(result) {
							callback('save', result);
							_data_popup_window.hide();
						});
					}
				},{
					text:'Cancel',
					handler: function(b, e) {
						callback('cancel');
						_data_popup_window.hide();
					}
				}]
			});
		}
		
		this._get_table_schema(layer_id, function(structure) {
			var source = new Array();
			var columns = new Object();
			for(var i=0; i<structure.length; i++) {
				columns[structure[i]['name']] = structure[i]['id'];
				source[structure[i]['name']] = '';
			}
			_data_popup_window_props._columns_mapping = columns;
			_data_popup_window_props.source = source;
			
			_data_popup_window.show();
		});
	},
	show_edit: function(layer_id, row_id, callback) {
		
	},
	_get_table_schema: function(layer_id, callback) {
		var schema_store = this._schema_store;
		if(!schema_store) {
			schema_store = new Object();
		}
		
		if(schema_store.hasOwnProperty(layer_id)) {
			callback(schema_store[layer_id]);
		} else {
			$.getJSON("/ajax/workspace/get-layer-schema/", {layer_id:layer_id}, function(result) {
				schema_store[layer_id] = result;
				callback(result);
			});
		}
	}
};

var _dataInfoWindow;

function initializeDataInfoWindow() {
	var propsGrid = new Ext.grid.PropertyGrid({
		width: 300,
		border: false,
		autoHeight: false,
		source: {
			data1: 'Data 1',
			data2: 'Data 2'
		},
		viewConfig : {
			forceFit: true,
			scrollOffset: 2 // the grid will never have scrollbars
		}
	});
	
	_dataInfoWindow = new Ext.Window({
		layout: 'fit',
		title: 'Data Window',
		width: 250,
		height: 400,
		closeAction: 'hide',
		items: propsGrid
	});
}

function openDataInfoWindow(layer_id, row_id) {
	var propsGrid = new Ext.grid.PropertyGrid({
		width: 300,
		border: false,
		autoHeight: false,
		source: {
			data1: 'Data 1',
			data2: 'Data 2'
		},
		viewConfig : {
			forceFit: true,
			scrollOffset: 2 // the grid will never have scrollbars
		}
	});
	
	_dataInfoWindow = new Ext.Window({
		layout: 'fit',
		title: 'Data Window',
		width: 250,
		height: 400,
		closeAction: 'hide',
		items: propsGrid
	});
}

/*
BASE MAP SELECTOR **********************************************************************************************************
*/

function initializeBaseMapSelection() {
	var store = new Ext.data.ArrayStore({
		fields: ['code', 'name'],
		data : [
			['google', 'Google Map'],
			['osm', 'Open Street Map']
		]
	});
	
	return {
		region: 'north',
		width: 274,
		height: 48,
		margins: '0 0 5 0',
		title: 'Base Map',
		layout: 'fit',
		items:[new Ext.form.ComboBox({
			displayField:'name',
			valueField:'code',
			value:'google',
			editable: false,
			forceSelection:true,
			mode: 'local',
			triggerAction: 'all',
			store: store,
			listeners: {
				select: function(combo, record, index) {
					var mapPanel = Ext.getCmp('workspace-map-panel');
					mapPanel.switchBaseLayer(combo.store.getAt(index).get("code"));
				}
			}
		})]
	};
}

/*
LAYERS PANEL ******************************************************************************************
*/

var _addLayerWindow;
var _manageLayersWindow;

function initializeAddLayerWindow() {
	if(!_addLayerWindow) {
		
		var sm = new Ext.grid.CheckboxSelectionModel({singleSelect:true});
		
		var store = new Ext.data.Store({
			autoDestroy: false,
			url: '/ajax/workspace/get-adding-tables/?workspace_id='+_workspace_id,
			reader: new Ext.data.JsonReader(),
			listeners: {
				'load': function(store, records, options) {
					_addLayerWindow.buttons[0].disable();
				}
			}
		});
		
		var grid = new Ext.grid.GridPanel({
			border:false,
			loadMask:true,
			store:store,
			selModel:sm,
			columns:[
				{id:'project_name', header:'Project Name', dataIndex:'project_name'},
				{id:'name', header:'Table Name', dataIndex:'name'}
			],
			autoExpandColumn: 'name',
			listeners: {
				'afterrender': function() {store.load();},
				'rowclick':function() {_addLayerWindow.buttons[0].enable();}
			}
		});
		
		_addLayerWindow = new Ext.Window({
			layout: 'fit',
			title: 'Add Layer',
			modal: true,
			width: 500,
			height: 250,
			closeAction: 'hide',
			items: grid,
			buttons: [{
				text:'Add',
				handler: function(b, e) {
					Ext.MessageBox.prompt('Layer Name', 'Layer name:', function(btn, text) {
						if(btn == 'ok') {
							var table_id = sm.getSelected().data['id'];
							
							Ext.Ajax.request({
								url: '/ajax/workspace/add-table-layer/',
								method: 'GET',
								success: function(response, opts) {
									var response_json = Ext.util.JSON.decode(response.responseText);
									
									var LayerRecord = Ext.data.Record.create({name: 'id'},{name: 'name'},{name: 'source_name'},{name: 'spatial_type'},{name: 'is_modified'},{name: 'is_editing'},{name: 'is_show'});
									var record = new LayerRecord({
										id: response_json['id'],
										name: text,
										source_name: response_json['source_name'],
										spatial_type: response_json['spatial_type'],
										is_modified: false,
										is_editing: false,
										is_show: true
									});
									
									var layerPanel = Ext.getCmp('workspace-layer-panel');
									layerPanel.store.add(record);
									
									_addLayerWindow.hide();
									
									// Load spatial data and show on map
									var mapPanel = Ext.getCmp('workspace-map-panel');
									mapPanel.showLayer(response_json['id']);
								},
								failure: function(response, opts) {},
								params: 'workspace_id='+_workspace_id+'&layer_name='+text+'&table_id='+table_id
							});
						}
					}, this, false, sm.getSelected().data['name']);
				}
			},{
				text:'Cancel',
				handler: function(b, e) {
					_addLayerWindow.hide();
				}
			}]
		});
	} else {
		_addLayerWindow.items.items[0].store.load();
	}
	
	return _addLayerWindow;
}

function initializeManageLayersWindow() {
	if(!_manageLayersWindow) {
		var store = new Ext.data.ArrayStore({
			fields: [{name: 'layer_id'},{name: 'layer_name'},{name: 'source_name'}]
		});
		
		var layerPanel = Ext.getCmp('workspace-layer-panel');
		
		var layerData = new Array();
		layerPanel.store.each(function(record) {
			layerData.push([record.data['id'], record.data['name'], record.data['source_name']]);
		});
		
		store.loadData(layerData);
		
		var sm = new Ext.grid.CheckboxSelectionModel();
		
		var grid = new Ext.grid.GridPanel({
			border:false,
			store:store,
			selModel:sm,
			tbar: [{text:'Rename'},{text:'Delete'},'-',{text:'Move Up'},{text:'Move Down'}],
			columns:[
				{id:'layer_name', header:'Layer Name', dataIndex:'layer_name'},
				{id:'source_name', header:'Source', dataIndex:'source_name'}
			],
			autoExpandColumn: 'source_name'
		});
		
		_manageLayersWindow = new Ext.Window({
			layout: 'fit',
			title: 'Manage Layers',
			modal: true,
			width: 500,
			height: 250,
			closeAction: 'hide',
			items: grid
		});
	}
	return _manageLayersWindow;
}

function initializeLayersPanel(preloaded_layers) {
	var store = new Ext.data.ArrayStore({
		fields: [{name: 'id'},{name: 'name'},{name: 'source_name'},{name: 'spatial_type'},{name: 'is_modified', type: 'boolean'},{name: 'is_editing', type: 'boolean'},{name: 'is_show', type: 'boolean'}]
	});
	
	var data = new Array();
	for(var i=0; i<preloaded_layers.length; i++) {
		data.push([preloaded_layers[i][0], preloaded_layers[i][1], preloaded_layers[i][2], preloaded_layers[i][3], false, false, preloaded_layers[i][4]]);
	}
	store.loadData(data);
	
	var tpl = new Ext.XTemplate(
		'<tpl for=".">',
			'<div class="layer_item <tpl if="is_editing">layer_item_editing</tpl>">',
				'<div class="header"><input type="checkbox" class="show_layer" <tpl if="is_show">checked="checked"</tpl> /><h3>{name}</h3></div>',
				'<div class="source">{source_name}</div>',
				'<div class="bottom">',
					'<div class="status">',
						'Status: <tpl if="!is_modified"><span class="nochange">NO CHANGE</span></tpl><tpl if="is_modified"><span class="modified">GEOMETRY MODIFIED</span> <a href="#" class="save_modified">save it</a></tpl>',
					'</div><div class="actions">',
						'<tpl if="!is_editing"><a href="#" class="edit_geometry">Edit Geometry Data</a></tpl><tpl if="is_editing"><span class="editing">editing mode</span> <a href="#" class="done_editing">I\'m done</a></tpl>',
					'</div>',
				'</div>',
			'</div>',
		'</tpl>'
	);
	
	var panel = new Ext.Panel({
		region: 'center',
		layout:'fit',
		title:'Layers',
		border: true,
		frame: false,
		items: new Ext.DataView({
			id: 'workspace-layer-panel',
			store: store,
			tpl: tpl,
			autoHeight:true,
			itemSelector:'div.layer_item',
			listeners: {
				click: function(t, index, node, e) {
					var store_item = t.store.getAt(index);
					var layer_id = store_item.get('id');
					var spatial_type = store_item.get('spatial_type');
					
					// EDIT LAYER DATA
					if(e.getTarget(".edit_geometry", node)) {
						e.preventDefault();
						
						for(var i=0; i<t.store.getTotalCount(); i++) {
							t.store.getAt(i).set('is_editing', false)
						}
						store_item.set('is_editing', true);
						t.render();
						
						var mapPanel = Ext.getCmp('workspace-map-panel');
						mapPanel.enterEditMode(layer_id, spatial_type,
						function() { // Dirty Callback
							store_item.set('is_modified', true);
							t.render();
						});
						
						$(".layer_item .edit_checkbox").attr("checked", false);
						e.getTarget().checked = true;
					}
					
					// EXIT EDIT MODE
					if(e.getTarget(".done_editing", node)) {
						e.preventDefault();
						
						store_item.set('is_editing', false);
						t.render();
						
						var mapPanel = Ext.getCmp('workspace-map-panel');
						mapPanel.enterViewMode();
					}
					
					// SAVE MODIFIED
					if(e.getTarget(".save_modified", node)) {
						e.preventDefault();
						
						var mapPanel = Ext.getCmp('workspace-map-panel');
						var features = mapPanel.getLayerFeatures(layer_id);
						
						var rows_query_string = '';
						for(var i=0; i<features.length; i++) {
							rows_query_string = rows_query_string + '&row=' + features[i].id + ',' + features[i].wkt;
						}
						
						$.ajax({type:"POST", url:"/ajax/workspace/save-layer-geo-data/", processData:false,
							data: "layer_id=" + layer_id + rows_query_string,
							success: function(msg){
								store_item.set('is_modified', false);
								t.render();
								Ext.MessageBox.alert('Status', 'Save geometry data successfully');
							}
						});
					}
				}
			}
		}),
		tbar: [{
			text:'Add Layer',
			handler: function(b, e) {
				initializeAddLayerWindow();
				_addLayerWindow.show(this);
			}
		},{
			text:'Manage Layers',
			handler: function(b, e) {
				initializeManageLayersWindow();
				_manageLayersWindow.show(this);
			}
		}]
	});
	
	return panel;
}

/*
DATA GRID PANEL **********************************************************************************************************
*/

var _dataGridRowMenu;
var _dataGridRowMenuRowIndex;

LayerDataPanel = Ext.extend(Ext.TabPanel, {
	initComponent : function() {
		var tabItems = new Array();
		
		for(var i=0; i<this.preloaded_layers.length; i++) {
			if(this.preloaded_layers[i][4] == true) {
				tabItems.push({
					id:'data-panel-tab-' + this.preloaded_layers[i][0],
					title:this.preloaded_layers[i][1],
					layout:'fit',
					layer_id:this.preloaded_layers[i][0],
					items:[{
						xtype:'layer_data_grid',
						layer_id:this.preloaded_layers[i][0]
					}]
				});
			}
		}
		
		var defConfig = {
			activeTab: 0,
			region: 'center',
			border: false,
			items: tabItems
		};
		
		Ext.applyIf(this,defConfig);
		LayerDataPanel.superclass.initComponent.call(this);
	},
	afterRender : function() {
		LayerDataPanel.superclass.afterRender.call(this);
	},
	showLayer: function(layer_id, layer_name) {
		var _this = this;
		var item = Ext.getCmp('data-panel-tab-' + layer_id);
		
		if(item == null) {
			item = _this.add({
				id:'data-panel-tab-' + layer_id,
				title:layer_name,
				layout:'fit',
				layer_id:layer_id,
				items:[{
					xtype:'layer_data_grid',
					layer_id:layer_id
				}]
			});
		} else {
			_this.unhideTabStripItem(item);
			item.show();
		}
		
		_this.setActiveTab(item);
		
		if(Ext.getCmp('workspace-data-panel-container').hidden) {
			Ext.getCmp('workspace-data-panel-container').show();
			Ext.getCmp('workspace-data-panel-container').ownerCt.doLayout();
		}
	},
	hideLayer: function(layer_id) {
		var _this = this;
		var item = Ext.getCmp('data-panel-tab-' + layer_id);
		
		_this.hideTabStripItem(item);
		item.hide();
		
		var visibleItems = 0;
		Ext.each(this.items.items, function(item) {
			var el = _this.getTabEl(item);
			if(el.style.display != 'none') {
				visibleItems = visibleItems + 1;
				_this.setActiveTab(item);
			}
		});
		
		if(visibleItems == 0) {
			Ext.getCmp('workspace-data-panel-container').hide();
			Ext.getCmp('workspace-data-panel-container').ownerCt.doLayout();
		}
	}
});
Ext.reg('layer_data_panel', LayerDataPanel);

LayerDataGrid = Ext.extend(Ext.grid.GridPanel, {
	initComponent : function(){
		var store = new Ext.data.Store({
			autoDestroy: true,
			url: '/ajax/workspace/get-layer-data/?layer_id=' + this.layer_id,
			reader: new Ext.data.JsonReader()
		});
		
		var defConfig = {
			store: store,
			border: false,
			cm: new Ext.grid.ColumnModel({columns:[]}),
			loadMask: true
		};
		Ext.apply(this, defConfig);
		
		var _layer_id = this.layer_id;
		this.addListener('cellclick', function(grid, rowIndex, columnIndex, e) {
			if(columnIndex == 0) {
				var feature_id = grid.getStore().getAt(rowIndex).id;
				
				var mapPanel = Ext.getCmp('workspace-map-panel');
				mapPanel.focusLayerFeature(_layer_id, feature_id);
			}
		});
		
		LayerDataGrid.superclass.initComponent.call(this);
	},
	afterRender : function(){
		var grid = this;
		
		this.store.on('load', function() {
			var columns = [];
			Ext.each(grid.store.reader.jsonData.columns, function(column) {
				columns.push(column);
			});
			grid.getColumnModel().setConfig(columns);
		});
		
		this.store.load();
		LayerDataGrid.superclass.afterRender.call(this);
	},
	listeners: {
		'rowdblclick': function(grid, rowIndex, e)  {
			// TODO: Center to this geometry
		},
		'rowcontextmenu': function(grid, rowIndex, e) {
			e.preventDefault();
			
			if(!_dataGridRowMenu) {
				_dataGridRowMenu = new Ext.menu.Menu({
					items: [
						{text: 'Data Popup', handler: function(item) {
							initializeDataInfoWindow();
							
							_dataInfoWindow.show();
							
							// TODO: Show data popup
						}},'-',
						{text: 'Delete', handler: function(item) {
							// TODO: Delete row
						}}
					]
				});
			}
			
			_dataGridRowMenuRowIndex = rowIndex;
			_dataGridRowMenu.showAt(e.getXY());
		}
	}
});
Ext.reg('layer_data_grid', LayerDataGrid);

function initializeDataPanel(preloaded_layers) {
	return {
		id:'workspace-data-panel-container',
		layout:'border',
		region:'south',
		split: true,
		collapseMode: 'mini',
		height:200,
		items: [{
			xtype:'layer_data_panel',
			id: 'workspace-data-panel',
			region:'center',
			preloaded_layers: preloaded_layers,
			callWhenDataAdded: function(layer_id, data) {
				// TODO: Add new data to store
				//console.log('callWhenDataAdded');
			}
		}]
	}
}

/*
VIEW WORKSPACE VIEWPORT **************************************************************************************************
*/

function initializeWorkspaceViewport() {
	var preloaded_layers = new Array();
	Ext.get('workspace-layers').select('li').each(function(el, c, idx) {
		var is_show = false;
		if(el.select('.is_show').first().dom.innerHTML == 'True') is_show = true;
		
		preloaded_layers.push([
			el.select('.layer_id').first().dom.innerHTML,
			el.select('.layer_name').first().dom.innerHTML,
			el.select('.source_name').first().dom.innerHTML,
			el.select('.spatial_type').first().dom.innerHTML,
			is_show
		]);
	});
	
	Ext.get('workspace-layers').remove();
	
	var viewport = new Ext.Viewport({
		layout:'border',
		cls: 'view_workspace_page',
		items: [{
			/* NORTH */
			region: 'north',
			xtype: 'box',
			applyTo: 'header',
			height: 30
		},{
			/* WEST */
			region: 'west',
			contentEl: 'west',
			layout: 'border',
			border: false,
			split: true,
			width: 274,
			minSize: 250,
			margins: '0 0 5 5',
			items: [initializeBaseMapSelection(), initializeLayersPanel(preloaded_layers)]
		},{
			/* CENTER */
			region: 'center',
			layout: 'border',
			contentEl: 'center',
			split: false,
			border: false,
			margins: '0 5 5 0',
			items: [initializeMapPanel(preloaded_layers), initializeDataPanel(preloaded_layers)]
		}]
	});
}
