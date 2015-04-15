define([
    'jquery',
    'underscore',
    'backbone',
    'backbone.radio',
    'backbone-forms',
    'requirejs-text!filter/tpl-filters.html',
    'requirejs-text!filter/tpl-CheckBoxes.html',

], function ($, _, Backbone, Radio, BbForms, tpl, tplcheck) {
    'use strict';
    return Backbone.View.extend({


        events: {
            "click input": 'clickedCheck'
        },

        /*=====================================
        =            Filter Module            =
        =====================================*/

        initialize: function (options) {
            this.channel = options.channel;
            this.radio = Radio.channel(this.channel);

            this.url = options.url;

            this.datas = {};
            this.form;
            this.datas;

            this.url = options.url + 'getFilters';

            this.forms = [];
            this.getFields();

        },


        getFields: function () {
            var ctx = this;

            var jqxhr = $.ajax({
                url: ctx.url,
                data: JSON.stringify({ criteria: ctx.datas }),
                contentType: 'application/json',
                type: 'GET',
                context: this,
            }).done(function (data) {
                this.initFilters(data);
                this.datas = data;
            }).fail(function (msg) {
                console.log(msg);
            });
        },

        initFilters: function (data) {
            var key;
            for (var i = 0; i < data.length; i++) {

                var form;
                var type = data[i].type;
                var fieldName = data[i].name;
                var label = data[i].label;
                var schm = {};
                var options = [];
                var template = tpl;
                var editorClass = 'form-control';

                if (type != 'BIT') {
                    schm['Column'] = { type: 'Hidden', title: null, value: fieldName };

                    schm['Operator'] = { type: 'Select', title: null, options: this.getOpOptions(type), editorClass: 'form-control' };

                    if (type == 'Select' || type == 'Checkboxes') {
                        editorClass = 'list-inline';
                        options = data[i].options;
                        options.splice(0, 0, { label: 'All', val: -1, checked: true });
                        template = tplcheck;
                    }
                    else {

                        options = [{
                            dateFormat: 'd/m/yyyy',
                            defaultValue: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear()
                        }];
                    }
                    schm['Value'] = {
                        type: this.getFieldType(type),
                        title: label,
                        editorClass: editorClass,
                        options: options
                    };
                    //console.log(schm);

                    console.log(schm);

                    var Formdata = {
                        Column: fieldName,
                        Operator: schm['Operator'].options[0]
                    };

                    form = new BbForms({
                        template: _.template(template),
                        schema: schm,
                        data:Formdata,
                        templateData: { filterName: label }
                    }).render();

                    $('#filters').append(form.el);
                    if (type == 'Checkboxes') {
                        $("#filters").find("input[type='checkbox']").each(function () {
                            //console.log(this);
                            $(this).prop('checked', true);
                        });
                    }
                    $("#filters input[type='checkbox']").on('click', this.clickedCheck);
                    

                    this.forms.push(form);
                }
            };


            $('#filters #dateTimePicker').each(function () {
                $(this).datetimepicker();
            });
            //$('#filters').load('filter/tpl-filters.html');


        },



        changeInput: function (options) {
        },




        clickedCheck: function (e) {
            // Keep the new check value
            var IsChecked = e.target.checked;
            if (e.target.value > 0) {
                //'Not checkall', We change the checkall if new target value is uncheked
                $(this).parent().parent().find('input:checkbox').each(function () {
                    if (this.value == -1 && !IsChecked) {
                        $(this).prop('checked', IsChecked);
                    }
                });
            }
            else {
                // CheckAll, all check input affected to checkAll Value
                //console.log('checkall');
                $(this).parent().parent().find('input:checkbox').each(function () {
                    $(this).prop('checked', IsChecked);
                });
            }
            
        },

        displayFilter: function () {

        },

        /*
        setTemplate: function(tpl){
            console.log('template');
            this.template = _.template(tpl);
            
        },
        */

        getOpOptions: function (type) {
            var operatorsOptions;
            switch (type) {
                case "String":
                    return operatorsOptions = ['Like', 'Not Like', 'IN'];
                    break;
                case "DATETIME":
                    return operatorsOptions = ['<', '>', '=', '<>', '<=', '>='];
                    break;
                case "Select":
                    return operatorsOptions = ['='];
                case "Checkboxes":
                    return operatorsOptions = ['Checked'];
                    break;
                    break;
                default:
                    return operatorsOptions = ['<', '>', '=', '<>', '<=', '>='];
                    break;
            }
        },

        getFieldType: function (type) {
            var typeField;
            switch (type) {
                case "String":
                    return typeField = "Text";
                    break;
                case "DATETIME":
                    return typeField = "BackboneDatepicker"; //DateTime
                    break;
                case "Select":
                    return typeField = "Select"; 
                    break;
                case "Checkboxes":
                    return typeField = "Checkboxes"; 
                    break;
                default:
                    return typeField = "Number";
                    break;
            }
        },

        update: function () {
            var filters = [];
            var currentForm;
            for (var i = 0; i < this.forms.length; i++) {
                currentForm = this.forms[i];
                if (!currentForm.validate()) {
                    filters.push(currentForm.getValue());
                }
            };
            this.radio.command(this.channel + ':grid:update', { filters: filters });
        },

        reset: function () {
            $('#filters').find('select').each(function () {
                $(this).prop('selectedIndex', 0);
            });
            $('#filters').find('input').each(function () {
                $(this).reload();
            });
        },

    });
});
