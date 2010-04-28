
var _data_popup_window;
var _data_popup_window_props;

var _data_popup_windows = {
	show_add: function(layer_id, save_callback, cancel_callback) {
		this._init_window();
		this.save_callback = save_callback;
		this.cancel_callback = cancel_callback;
		this.load_data(layer_id);
	},
	show_edit: function(layer_id, data, save_callback, cancel_callback) {
		this._init_window();
		this.save_callback = save_callback;
		this.cancel_callback = cancel_callback;
		this.load_data(layer_id, data);
	},
	_init_window: function() {
		if(!_data_popup_window || !_data_popup_window_props) {
			var _this = this;
			
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
				title: 'Data',
				width: 350,
				height: 400,
				closeAction: 'hide',
				items: _data_popup_window_props,
				buttons: [{
					text:'Save',
					handler: function(b, e) {
						if(_this.save_callback) {
							var data = new Object();
							for(var i=0; i<_data_popup_window_props.store.data.items.length; i++) {
								data[_data_popup_window_props.store.data.items[i].data.name+''] = _data_popup_window_props.store.data.items[i].data.value;
							}
							_this.save_callback(data, _data_popup_window);
						}
					}
				},{
					text:'Cancel',
					handler: function(b, e) {
						if(_this.cancel_callback) _this.cancel_callback(_data_popup_window);
					}
				}]
			});
		}
	},
	load_data: function(layer_id, data) {
		var schema_store = this._schema_store;
		if(!schema_store) {
			schema_store = new Object();
		}
		
		var _this = this;
		
		if(schema_store.hasOwnProperty(layer_id)) {
			this._load_schema(schema_store[layer_id], data);
		} else {
			$.getJSON("/ajax/workspace/get-layer-schema/", {layer_id:layer_id}, function(result) {
				schema_store[layer_id] = result;
				_this._load_schema(result, data);
			});
		}
	},
	_load_schema: function(schema, data) {
		var propertyNames = new Object();
		var source = new Object();
		
		for(var i=0; i<schema.length; i++) {
			propertyNames[''+schema[i]['id']] = schema[i]['name'];
			if(data != undefined) {
				source[''+schema[i]['id']] = data[schema[i]['id']];
			} else {
				source[''+schema[i]['id']] = '';
			}
		}
		
		_data_popup_window_props.propertyNames = propertyNames;
		_data_popup_window_props.setSource(source);
		
		_data_popup_window.show();
	}
};

/*
BASE MAP SELECTOR **********************************************************************************************************
*/

function initializeBaseMapSelection() {
	var store = new Ext.data.ArrayStore({
		fields: ['code', 'name'],
		data : [
			['google_map', 'Google Map - Normal'],
			['google_sat', 'Google Map - Hybrid'],
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
			value:'google_sat',
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
					if(records.length == 0) {
						Ext.MessageBox.alert('Available Layer Not Found', 'There is no available layer to be added.');
						_addLayerWindow.hide();
					}
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
			listeners:{
				'show':function(t) {
					sm.clearSelections();
					_addLayerWindow.buttons[0].disable();
				}
			},
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
									var layer_id = response_json['id'];
									
									_addLayerWindow.hide();
									
									// ADD to Layer Panel
									var LayerRecord = Ext.data.Record.create({name: 'id'},{name: 'name'},{name: 'source_name'},{name: 'spatial_type'},{name: 'is_modified', type: 'boolean'},{name: 'is_editing', type: 'boolean'},{name: 'is_show', type: 'boolean'});
									var record = new LayerRecord({
										id: layer_id,
										name: text,
										source_name: response_json['source_name'],
										spatial_type: response_json['spatial_type'],
										is_modified: false,
										is_editing: false,
										is_show: true
									}, layer_id);
									
									var layerPanel = Ext.getCmp('workspace-layer-panel');
									layerPanel.store.add([record]);
									
									// ADD to Map Panel
									var mapPanel = Ext.getCmp('workspace-map-panel');
									mapPanel.addLayer(layer_id);
									
									// ADD to Data Panel
									var dataPanel = Ext.getCmp('workspace-data-panel');
									dataPanel.addLayer(layer_id, text);
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
			idIndex:0,
			fields: [{name: 'id'},{name: 'name'},{name: 'source_name'}]
		});
		
		var sm = new Ext.grid.CheckboxSelectionModel();
		
		var grid = new Ext.grid.GridPanel({
			border:false,
			store:store,
			selModel:sm,
			tbar: [{
				text:'Rename', handler: function(b, e) {
					Ext.MessageBox.prompt('Layer Name', 'Layer name:', function(btn, text) {
						if(btn == 'ok') {
							Ext.Ajax.request({
								url: '/ajax/workspace/rename-layer/',
								method: 'POST',
								success: function(response, opts) {
									var layer_id = sm.getSelected().data['id'];
									
									var layerPanel = Ext.getCmp('workspace-layer-panel');
									layerPanel.store.getById(layer_id).set('name', text);
									layerPanel.render();
									
									store.getById(layer_id).set('name', text);
									grid.render();
									
									var dataPanel = Ext.getCmp('workspace-data-panel');
									dataPanel.renameLayer(layer_id, text);
								},
								failure: function(response, opts) {},
								params: 'layer_id=' + sm.getSelected().data['id'] + '&layer_name='+text
							});
						}
					}, this, false, sm.getSelected().data['name']);
				}
			},{
				text:'Delete', handler: function(b, e) {
					Ext.MessageBox.confirm('Delete Confirmation', 'Really want to delete this layer?', function(btn) {
						if(btn == 'yes') {
							Ext.Ajax.request({
								url: '/ajax/workspace/delete-layer/',
								method: 'POST',
								success: function(response, opts) {
									var layer_id = sm.getSelected().data['id'];
									
									var layerPanel = Ext.getCmp('workspace-layer-panel');
									layerPanel.store.remove(layerPanel.store.getById(layer_id));
									
									store.remove(store.getById(layer_id));
									
									// Remove from map panel
									var mapPanel = Ext.getCmp('workspace-map-panel');
									mapPanel.removeLayer(layer_id);
									
									// Remove from data panel
									var dataPanel = Ext.getCmp('workspace-data-panel');
									dataPanel.removeLayer(layer_id);
								},
								failure: function(response, opts) {},
								params: 'layer_id=' + sm.getSelected().data['id']
							});
						}
					});
				}
			}],
			columns:[
				{id:'name', header:'Layer Name', dataIndex:'name'},
				{id:'source_name', header:'Source', dataIndex:'source_name'}
			],
			autoExpandColumn: 'source_name',
			listeners: {
				'rowclick':function() {
					for(var i=0; i<grid.getTopToolbar().items.items.length; i++) {
						grid.getTopToolbar().items.items[i].enable();
					}
				}
			}
		});
		
		_manageLayersWindow = new Ext.Window({
			layout: 'fit',
			title: 'Manage Layers',
			modal: true,
			width: 500,
			height: 250,
			closeAction: 'hide',
			items: grid,
			listeners:{
				'show':function(t) {
					var layerPanel = Ext.getCmp('workspace-layer-panel');
					
					var layerData = new Array();
					layerPanel.store.each(function(record) {
						layerData.push([record.data['id'], record.data['name'], record.data['source_name']]);
					});
					
					store.loadData(layerData);
					
					sm.clearSelections();
					for(var i=0; i<grid.getTopToolbar().items.items.length; i++) {
						grid.getTopToolbar().items.items[i].disable();
					}
				}
			},
			buttons: [{
				text:'Close',
				handler: function(b, e) {
					_manageLayersWindow.hide();
				}
			}]
		});
	}
	return _manageLayersWindow;
}

function initializeLayersPanel(preloaded_layers) {
	var store = new Ext.data.ArrayStore({
		idIndex:0,
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
					
					// TOGGLE LAYER
					if(e.getTarget(".show_layer", node)) {
						var mapPanel = Ext.getCmp('workspace-map-panel');
						var dataPanel = Ext.getCmp('workspace-data-panel');
						
						mapPanel.toggleLayer(layer_id, e.target.checked);
						dataPanel.toggleLayer(layer_id, e.target.checked);
					}
					
					// EDIT LAYER DATA
					if(e.getTarget(".edit_geometry", node)) {
						e.preventDefault();
						
						for(var i=0; i<t.store.getTotalCount(); i++) {
							t.store.getAt(i).set('is_editing', false)
						}
						store_item.set('is_editing', true);
						t.render();
						
						var mapPanel = Ext.getCmp('workspace-map-panel');
						mapPanel.enterEditMode(layer_id, spatial_type, function() { // Dirty Callback
							store_item.set('is_modified', true);
							t.render();
						});
						
						$(".layer_item .show_layer").attr("checked", true);
						mapPanel.toggleLayer(layer_id, true);
						
						var dataPanel = Ext.getCmp('workspace-data-panel');
						dataPanel.toggleLayer(layer_id, true);
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
						
						$.ajax({type:"POST", url:"/ajax/workspace/update-layer-row-spatial/", processData:false,
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
						id: 'data-panel-grid-' + this.preloaded_layers[i][0],
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
	
	addLayer: function(layer_id, layer_name) {
		var item = Ext.getCmp('data-panel-tab-' + layer_id);
		
		if(item != undefined) {
			item.destroy();
		}
		
		this.add({
			id: 'data-panel-tab-' + layer_id,
			title: layer_name,
			layout: 'fit',
			layer_id: layer_id,
			items: [{
				id: 'data-panel-grid-' + layer_id,
				xtype: 'layer_data_grid',
				layer_id: layer_id
			}]
		});
	},
	renameLayer: function(layer_id, layer_name) {
		var item = Ext.getCmp('data-panel-tab-' + layer_id);
		item.setTitle(layer_name);
	},
	removeLayer: function(layer_id) {
		var item = Ext.getCmp('data-panel-tab-' + layer_id);
		if(item != undefined) {
			item.destroy();
		}
	},
	toggleLayer: function(layer_id, visibility) {
		var _this = this;
		var item = Ext.getCmp('data-panel-tab-' + layer_id);
		
		if(item != undefined) {
			if(visibility) {
				_this.unhideTabStripItem(item);
				item.show();
				
				_this.setActiveTab(item);
				
				if(Ext.getCmp('workspace-data-panel-container').hidden) {
					Ext.getCmp('workspace-data-panel-container').show();
					Ext.getCmp('workspace-data-panel-container').ownerCt.doLayout();
				}
				
			} else {
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
		}
	},
	addLayerRow: function(layer_id, row_id, data) {
		var grid = Ext.getCmp('data-panel-grid-' + layer_id);
		var record = new grid.store.recordType(data, row_id);
		grid.store.insert(0, record);
	},
	updateLayerRow: function(layer_id, row_id, data) {
		var grid = Ext.getCmp('data-panel-grid-' + layer_id);
		var record = grid.store.getById(row_id);
		
		for(key in data) {
			record.set(key, data[key]);
		}
	},
	deleteLayerRow: function(layer_id, row_id) {
		var grid = Ext.getCmp('data-panel-grid-' + layer_id);
		grid.store.remove(grid.store.getById(row_id));
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
		'cellclick': function(grid, rowIndex, columnIndex, e) {
			var mapPanel = Ext.getCmp('workspace-map-panel');
			
			mapPanel.showFeaturePopup(grid.layer_id, grid.getStore().getAt(rowIndex).id, grid.getStore().getAt(rowIndex).data, grid.getColumnModel().config);
		},
		'rowdblclick': function(grid, rowIndex, e)  {
			this._edit_row(grid, rowIndex);
		},
		'rowcontextmenu': function(grid, rowIndex, e) {
			e.preventDefault();
			var _this = this;
			
			if(!_dataGridRowMenu) {
				_dataGridRowMenu = new Ext.menu.Menu({
					items: [{
						text: 'Edit', handler: function(item) {
							_this._edit_row(_dataGridRowMenu._active_grid, _dataGridRowMenu._active_rowIndex);
						}
					}, {
						text: 'Delete', handler: function(item) {
							var layer_id = _dataGridRowMenu._active_grid.layer_id;
							var row_id = grid.getStore().getAt(_dataGridRowMenu._active_rowIndex).id;
							
							Ext.MessageBox.confirm('Delete Confirmation', 'Really want to delete this row?', function(btn) {
								if(btn == 'yes') {
									Ext.Ajax.request({
										url: '/ajax/workspace/delete-layer-row/',
										method: 'POST',
										success: function(response, opts) {
											var dataPanel = Ext.getCmp('workspace-data-panel');
											dataPanel.deleteLayerRow(layer_id, row_id);
											
											var mapPanel = Ext.getCmp('workspace-map-panel');
											mapPanel.deleteLayerFeature(layer_id, row_id);
										},
										failure: function(response, opts) {},
										params: 'layer_id=' + layer_id + '&row_id=' + row_id
									});
								}
							});
						}
					}]
				});
			}
			
			_dataGridRowMenu.showAt(e.getXY());
			_dataGridRowMenu._active_grid = grid;
			_dataGridRowMenu._active_rowIndex = rowIndex;
		}
	},
	_edit_row: function(grid, rowIndex) {
		_data_popup_windows.show_edit(grid.layer_id, grid.getStore().getAt(rowIndex).data, function(data, _data_popup_window) {
			data['layer_id'] = grid.layer_id;
			data['row_id'] = grid.getStore().getAt(rowIndex).id;
			
			$.post("/ajax/workspace/update-layer-row/", data, function(result) {
				var dataPanel = Ext.getCmp('workspace-data-panel');
				dataPanel.updateLayerRow(grid.layer_id, grid.getStore().getAt(rowIndex).id, data);
				
				_data_popup_window.hide();
			});
		}, function(_data_popup_window) {
			_data_popup_window.hide();
		});
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
			preloaded_layers: preloaded_layers
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
