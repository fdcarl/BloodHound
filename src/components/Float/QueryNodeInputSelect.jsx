import React, { Component } from 'react';
import { ListGroup, ListGroupItem, Panel } from 'react-bootstrap'
import { If, Then, Else } from 'react-if';
import QueryNodeSelectItem from './QueryNodeSelectItem'

export default class QueryNodeInputSelect extends Component {
	constructor(){
		super();

		this.state = {
			data:[],
			queryData: {}
		}
		emitter.on('nodeInputSelectQuery', this.getEventInfo.bind(this))		
	}

	getEventInfo(query){
		$(this.refs.inputselectouter).fadeToggle(true)
		this.state.queryData = query
		var session = driver.session()
		if (query.start !== ""){
			session.run(query.query, query.queryProps)
				.then(function(results){
					var y = $.map(results.records, function(x){
						return x._fields[0]
					})
					y.sort()
					this.setState({data: y})
					session.close()
				}.bind(this))
		}
	}

	componentDidMount() {
		$(this.refs.inputselectouter).fadeToggle(0)

		jQuery(this.refs.querysearchbar).typeahead({
			source: function(query, process) {
				var session = driver.session()
				var t = '(?i).*' + query + '.*'
				var data = []
				session.run("MATCH (n) WHERE n.name =~ {name} RETURN n LIMIT 10", {name:t})
					.then(function(results){
						$.each(results.records, function(index, record){
							data.push(record._fields[0].properties.name + "#" + record._fields[0].labels[0])
						})
						session.close()
						return process(data)
					})
			},
			afterSelect: function(selected) {
				if (!this.state.pathfindingIsOpen) {
					var statement = "MATCH (n) WHERE n.name = {name} RETURN n"
					emitter.emit('searchQuery', statement, {name: selected.split("#")[0]})
				} else {
					var start = jQuery(this.refs.querysearchbar).val();
					var end = jQuery(this.refs.pathbar).val();
					if (start !== "" && end !== "") {
						emitter.emit('pathQuery', start, end);
					}
				}
			}.bind(this),
			autoSelect: false,
			updater: function(item){
				return item.split("#")[0]
			},
			highlighter: function(item) {
				var parts = item.split("#")
				var query = this.query;
				var icon = "";
				var html = ""
				switch (parts[1]){
					case "Group":
						icon = "<i style=\"float:right\" class=\"fa fa-users\"></i>"
					break;
					case "User":
						icon = "<i style=\"float:right\" class=\"fa fa-user\"></i>"
					break;
					case "Computer":
						icon = "<i style=\"float:right\" class=\"fa fa-desktop\"></i>"
					break;
					case "Domain":
						icon = "<i style=\"float:right\" class=\"fa fa-globe\"></i>"
					break
				}

				html = '<div>' + parts[0] + ' ' + icon + '</div>'
			
				var reEscQuery = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
				var reQuery = new RegExp('(' + reEscQuery + ')', "gi");
                	
				var jElem = $(html)
				var textNodes = $(jElem.find('*')).add(jElem).contents().filter(function () { return this.nodeType === 3; });
				textNodes.replaceWith(function() {
					return $(this).text().replace(reQuery, '<strong>$1</strong>')
				});

				return jElem.html();
			}
		})
	}

	_inputKeyPress(e){
		var key = e.keyCode ? e.keyCode : e.which
		var start = jQuery(this.refs.querysearchbar).val();
		var stop = false;

		if (key === 13){
			if (!$('.searchSelectorS > ul').is(':hidden')){
				$('.searchSelectorS > ul li').each(function(i){
					if($(this).hasClass('active')){
						stop = true
					}
				})    
			}

			if (!$('.searchSelectorP > ul').is(':hidden')){
				$('.searchSelectorP > ul li').each(function(i){
					if($(this).hasClass('active')){
						stop = true
					}
				})
			}
			if (stop){
				return;
			}
			if (start !== ""){
				emitter.emit('query',
					this.state.queryData.onFinish.formatAll(start),
					{result:start},
					this.state.queryData.start.format(start),
					this.state.queryData.end.format(start),
					this.state.queryData.allowCollapse)
				$(this.refs.inputselectouter).fadeToggle(false)
			}
		}
	}

	_dismiss(){
		$(this.refs.inputselectouter).fadeToggle(false)
	}

	handleClick(event){
		emitter.emit('query',
			this.state.queryData.onFinish.formatAll(event.target.text),
			{result:event.target.text},
			this.state.queryData.start.format(event.target.text),
			this.state.queryData.end.format(event.target.text),
			this.state.queryData.allowCollapse)
		$(this.refs.inputselectouter).fadeToggle(false)
	}

	render() {
		var header = <QueryNodeInputSelectHeader length={this.state.data.length} title={this.state.queryData.boxTitle} dismiss={this._dismiss.bind(this)}/>
		return (
			<div className="queryNodeInputSelect" ref="inputselectouter">
				<Panel header={header}>
					<div className="input-group input-group-unstyled searchSelectorS">
						<input ref="querysearchbar" onKeyDown={this._inputKeyPress.bind(this)} type="search" className="form-control searchbox" autoComplete="off" placeholder={this.state.mainPlaceholder} />
					</div>	
				</Panel>
			</div>
		);
	}
}

class QueryNodeInputSelectHeader extends Component {
	render() {
		var title = this.props.length > 0 ? this.props.title : "Loading..."
		return (
			<div>
				{title}
				<button type="button" className="close" onClick={this.props.dismiss} aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
		);
	}
}
