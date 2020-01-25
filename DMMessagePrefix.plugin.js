//META{"name":"DMMessagePrefix","website":"https://github.com/DMMessagePrefixBD/DMMessagePrefix","source":"https://raw.githubusercontent.com/DMMessagePrefixBD/DMMessagePrefix/master/DMMessagePrefix.plugin.js"}*//

class DMMessagePrefix {
	getName () {return "DMMessagePrefix";}

	getVersion () {return "1.0.0";}

	getAuthor () {return "zulu";}

	getDescription () {return "Discord DM Prefixer";}

	getRawUrl () {return "https://raw.githubusercontent.com/DMMessagePrefixBD/DMMessagePrefix/master/DMMessagePrefix.plugin.js";}

	constructor () {
		this.patchedModules = {
			before: {
				ChannelTextAreaForm: "render"
			}
		};
	}

	initConstructor () {
		this.defaults = {
			settings: {
				captializeWords:		{value:true,						description:"Change all words sent in a DM channel to capitalized"}
			},
			inputs: {
				messagePrefix:			{value:"[message to $mention]", 	description:"DM Channel Message Prefix"}
			}
		};
	}

	getSettingsPanel (collapseStates = {}) {
		if (!window.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded || !this.started) return;
		let settings = BDFDB.DataUtils.get(this, "settings");
		let inputs = BDFDB.DataUtils.get(this, "inputs");
		let settingspanel, settingsitems = [], inneritems = [];
		
		for (let key in settings) inneritems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
			className: BDFDB.disCN.marginbottom8,
			type: "Switch",
			plugin: this,
			keys: ["settings", key],
			label: this.defaults.settings[key].description,
			value: settings[key]
		}));
		inneritems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
			className: BDFDB.disCN.marginbottom8
		}));
		for (let key in inputs) inneritems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
			className: BDFDB.disCN.marginbottom8,
			type: "TextInput",
			plugin: this,
			keys: ["inputs", key],
			label: this.defaults.inputs[key].description,
			basis: "50%",
			value: inputs[key]
		}));
		settingsitems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
			title: "Settings",
			collapseStates: collapseStates,
			children: inneritems
		}));
		settingsitems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
			title: "Prefix Placeholder Guide",
			collapseStates: collapseStates,
			dividertop: true,
			children: ["$mention will be replaced with a mention of the DM recipient.", "$channelId will be replaced with the ID of the DM Channel.", "$userId will be replaced with the ID of the DM recipient.", "$authorId will be replaced with your ID."].map(string => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormText, {
				type: BDFDB.LibraryComponents.FormComponents.FormTextTypes.DESCRIPTION,
				children: string
			}))
		}));
		
		return settingspanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsitems);
	}

	//legacy
	load () {}

	start () {
		if (!window.BDFDB) window.BDFDB = {myPlugins:{}};
		if (window.BDFDB && window.BDFDB.myPlugins && typeof window.BDFDB.myPlugins == "object") window.BDFDB.myPlugins[this.getName()] = this;
		let libraryScript = document.querySelector("head script#BDFDBLibraryScript");
		if (!libraryScript || (performance.now() - libraryScript.getAttribute("date")) > 600000) {
			if (libraryScript) libraryScript.remove();
			libraryScript = document.createElement("script");
			libraryScript.setAttribute("id", "BDFDBLibraryScript");
			libraryScript.setAttribute("type", "text/javascript");
			libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.min.js");
			libraryScript.setAttribute("date", performance.now());
			libraryScript.addEventListener("load", _ => {this.initialize();});
			document.head.appendChild(libraryScript);
		}
		else if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
		this.startTimeout = setTimeout(_ => {
			try {return this.initialize();}
			catch (err) {console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not initiate plugin! " + err);}
		}, 30000);
	}

	initialize () {
		if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			if (this.started) return;
			BDFDB.PluginUtils.init(this);

			BDFDB.ModuleUtils.forceAllUpdates(this);
		}
		else {
			console.error(`%c[${this.getName()}]%c`, 'color: #3a71c1; font-weight: 700;', '', 'Fatal Error: Could not load BD functions!');
		}
	}

	stop () {
		if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			this.stopping = true;

			BDFDB.ModuleUtils.forceAllUpdates(this);

			BDFDB.PluginUtils.clear(this);
		}
	}

	
	// begin of own functions
	
	processChannelTextAreaForm (e) {
		if (!BDFDB.ModuleUtils.isPatched(this, e.instance, "handleSendMessage")) BDFDB.ModuleUtils.patch(this, e.instance, "handleSendMessage", {before: e2 => {
			let channel = BDFDB.LibraryModules.ChannelStore.getChannel(BDFDB.LibraryModules.LastChannelStore.getChannelId());
			if (channel && channel.type == BDFDB.DiscordConstants.ChannelTypes.DM) {
				let settings = BDFDB.DataUtils.get(this, "settings");
				let inputs = BDFDB.DataUtils.get(this, "inputs");
				e2.methodArguments[0] = this.formatPrefix(inputs.messagePrefix, channel) + (settings.captializeWords ? this.capitalize(e2.methodArguments[0]) : e2.methodArguments[0]);
			}
		}}, true);
	}
	
	formatPrefix (prefix, channel) {
		if (typeof prefix != "string" || !prefix) return "";
		else {
			let recipientId = channel.getRecipientId();
			return prefix
				.replace("$mention", `<@!${recipientId}>`)
				.replace("$channelId", channel.id)
				.replace("$userId", recipientId)
				.replace("$authorId", BDFDB.UserUtils.me.id) + " ";
		}
	}
	
	capitalize (string) {
		if (typeof string != "string" || !string) return "";
		else return string
			.split(" ").map(w => BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(w)).join(" ")
			.split("\n").map(w => BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(w)).join("\n")
			.split("\t").map(w => BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(w)).join("\t")
			.split("\r").map(w => BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(w)).join("\r");
	}
}
