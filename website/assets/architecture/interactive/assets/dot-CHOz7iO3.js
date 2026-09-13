var e = (e) => {
    switch (e) {
      case `index`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=index,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        label="\\N",
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    author [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Document Author</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Software engineer writing, editing, and<BR/>previewing markdown documentation</FONT></TD></TR></TABLE>>,
        likec4_id=author,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    mdcomments [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Markdown Comments</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Multi-platform, local-first documentation<BR/>review and commenting system storing comments<BR/>outside source branches</FONT></TD></TR></TABLE>>,
        likec4_id=mdComments,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    author -> mdcomments [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="13jjhp2",
        minlen=1,
        style=dashed];
    reviewer [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Pull Request Reviewer</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Peer engineer or technical lead reviewing<BR/>markdown documentation in PRs or local<BR/>editors</FONT></TD></TR></TABLE>>,
        likec4_id=reviewer,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    reviewer -> mdcomments [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=tako3y,
        minlen=1,
        style=dashed];
    aiagent [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">AI Coding Agent</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Autonomous coding agent (Antigravity, Claude<BR/>Code, Cursor) creating and resolving review<BR/>comments</FONT></TD></TR></TABLE>>,
        likec4_id=aiAgent,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    aiagent -> mdcomments [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reads and leaves anchored comments via<BR/>agentic workflows</FONT></TD></TR></TABLE>>,
        likec4_id="16y9yxe",
        minlen=1,
        style=dashed];
    browserregistries [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Browser Extension Registries</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Chrome Web Store, Microsoft Edge Add-ons,<BR/>Mozilla Add-ons, and Apple App Store</FONT></TD></TR></TABLE>>,
        likec4_id=browserRegistries,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    githubapi [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">GitHub REST &amp; GraphQL API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External GitHub API providing Git Data API<BR/>(trees, commits, refs), OAuth Device Flow,<BR/>user profiles, and commit comments</FONT></TD></TR></TABLE>>,
        likec4_id=githubApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    mdcomments -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id=ln2wny,
        minlen=1,
        style=dashed];
    gitremote [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Git Remote Repository</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Upstream Git repository hosting project<BR/>source branches and the orphan<BR/>refs/md-comments/data branch</FONT></TD></TR></TABLE>>,
        likec4_id=gitRemote,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    mdcomments -> gitremote [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Pushed and fetched from git remote</FONT></TD></TR></TABLE>>,
        likec4_id="1v39qf1",
        minlen=1,
        style=dashed];
    otelbackend [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">OpenTelemetry Backend</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External telemetry ingestion endpoint<BR/>receiving scrubbed, anonymous performance and<BR/>diagnostic metrics</FONT></TD></TR></TABLE>>,
        likec4_id=otelBackend,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    mdcomments -> otelbackend [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Forwards sanitized telemetry spans</FONT></TD></TR></TABLE>>,
        likec4_id="1sa9gl1",
        minlen=1,
        style=dashed];
}
`;
      case `systemContext`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=systemContext,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        label="\\N",
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    subgraph cluster_mdcomments {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>MARKDOWN COMMENTS</B></FONT>>,
            likec4_depth=1,
            likec4_id=mdComments,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        vscodeext [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">VS Code Extension Subsystem</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, VS Code Extension API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Desktop IDE extension hosting early hooks,<BR/>auth resolution, optimistic state management,<BR/>and preview integration</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        chromeext [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Chrome / Edge / Firefox Extension</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, Manifest V3, WebExtensions</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Cross-browser Manifest V3 extension injecting<BR/>comment threads onto GitHub markdown previews<BR/>and raw files</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.chromeExt",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        obsidianplugin [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Obsidian Plugin</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, Obsidian API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Obsidian Vault plugin supporting reading view<BR/>anchors, live preview gutters, and sidebar<BR/>commenting</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.obsidianPlugin",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        starlightplugin [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Astro / Starlight Plugin</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Astro, TypeScript, CSS3</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Documentation theme plugin and Astro<BR/>integration providing an interactive<BR/>slide-over comment drawer</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.starlightPlugin",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        webviewpreview [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Webview Preview Runtime</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">HTML5, CSS3, Vanilla JavaScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">In-situ markdown preview webview environment<BR/>hosting interactive comment cards, inline<BR/>badges, and sidebar drawer</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.webviewPreview",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        telemetryproxy [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Telemetry Proxy</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, Cloudflare Workers / Node.js</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Zero-secret OpenTelemetry proxy scrubbing<BR/>customer content, file paths, and author<BR/>identities</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.telemetryProxy",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        sharedengine [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Shared Domain Engine</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Core domain engine with FNV-1a anchor<BR/>hashing, fuzzy re-anchoring, Git Data API<BR/>backend, and 3-way merge logic</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.sharedEngine",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        safariext [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">macOS Safari Extension</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Swift, WebKit, Manifest V2/V3</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Native macOS Safari Web Extension packaged<BR/>with AppKit host application</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.safariExt",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        gitrefstorage [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Git Ref Data Store</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Git Ref, YAML</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Orphan git ref (refs/md-comments/data)<BR/>storing versioned YAML comments completely<BR/>outside source branches</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.gitRefStorage",
            likec4_level=1,
            margin="0.223,0",
            penwidth=2,
            shape=cylinder,
            width=4.445];
    }
    author [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Document Author</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Software engineer writing, editing, and<BR/>previewing markdown documentation</FONT></TD></TR></TABLE>>,
        likec4_id=author,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    author -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Edits markdown and previews comments in<BR/>VS Code</FONT></TD></TR></TABLE>>,
        likec4_id="1pyfxjt",
        style=dashed];
    author -> webviewpreview [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Interacts with preview drawer and<BR/>comment threads</FONT></TD></TR></TABLE>>,
        likec4_id="14b9cun",
        style=dashed];
    reviewer [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Pull Request Reviewer</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Peer engineer or technical lead reviewing<BR/>markdown documentation in PRs or local<BR/>editors</FONT></TD></TR></TABLE>>,
        likec4_id=reviewer,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    reviewer -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reviews local documentation in VS Code</FONT></TD></TR></TABLE>>,
        likec4_id=fuwgjl,
        style=dashed];
    reviewer -> chromeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reviews PR markdown files on GitHub</FONT></TD></TR></TABLE>>,
        likec4_id=r0im5z,
        style=dashed];
    aiagent [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">AI Coding Agent</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Autonomous coding agent (Antigravity, Claude<BR/>Code, Cursor) creating and resolving review<BR/>comments</FONT></TD></TR></TABLE>>,
        likec4_id=aiAgent,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    aiagent -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reads and leaves anchored comments via<BR/>agentic workflows</FONT></TD></TR></TABLE>>,
        likec4_id=o9ycpp,
        minlen=1,
        style=dashed];
    vscodeext -> webviewpreview [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="168z0xo",
        style=dashed];
    vscodeext -> telemetryproxy [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Transmits scrubbed, anonymous telemetry<BR/>payloads</FONT></TD></TR></TABLE>>,
        likec4_id="9brdt4",
        style=dashed,
        weight=2];
    vscodeext -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="3cat3g",
        style=dashed,
        weight=2];
    githubapi [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">GitHub REST &amp; GraphQL API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External GitHub API providing Git Data API<BR/>(trees, commits, refs), OAuth Device Flow,<BR/>user profiles, and commit comments</FONT></TD></TR></TABLE>>,
        likec4_id=githubApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    vscodeext -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="4xt4i9",
        style=dashed];
    chromeext -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and YAML<BR/>serialization</FONT></TD></TR></TABLE>>,
        likec4_id="13znfne",
        style=dashed,
        weight=2];
    chromeext -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Interacts with GitHub Git Data API via<BR/>Device Flow</FONT></TD></TR></TABLE>>,
        likec4_id="13x5raf",
        style=dashed];
    obsidianplugin -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and local storage</FONT></TD></TR></TABLE>>,
        likec4_id="1b4eh5d",
        minlen=1,
        style=dashed,
        weight=2];
    starlightplugin -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and client drawer</FONT></TD></TR></TABLE>>,
        likec4_id=z0am4u,
        minlen=1,
        style=dashed,
        weight=2];
    webviewpreview -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Dispatches actions (add, reply, edit,<BR/>delete, react) via postMessage</FONT></TD></TR></TABLE>>,
        likec4_id="1p96uws",
        style=dashed];
    otelbackend [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">OpenTelemetry Backend</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External telemetry ingestion endpoint<BR/>receiving scrubbed, anonymous performance and<BR/>diagnostic metrics</FONT></TD></TR></TABLE>>,
        likec4_id=otelBackend,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    telemetryproxy -> otelbackend [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Forwards sanitized telemetry spans</FONT></TD></TR></TABLE>>,
        likec4_id=ps2g7s,
        minlen=1,
        style=dashed];
    sharedengine -> gitrefstorage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reads and writes refs/md-comments/data</FONT></TD></TR></TABLE>>,
        likec4_id="1hw0rj",
        style=dashed,
        weight=2];
    sharedengine -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Fetches commit parent, base tree SHA,<BR/>and creates trees/commits</FONT></TD></TR></TABLE>>,
        likec4_id="1aryzfb",
        style=dashed];
    gitremote [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Git Remote Repository</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Upstream Git repository hosting project<BR/>source branches and the orphan<BR/>refs/md-comments/data branch</FONT></TD></TR></TABLE>>,
        likec4_id=gitRemote,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    gitrefstorage -> gitremote [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Pushed and fetched from git remote</FONT></TD></TR></TABLE>>,
        likec4_id="10o2cdd",
        minlen=1,
        style=dashed];
}
`;
      case `containers`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=containers,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    subgraph cluster_mdcomments {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>MARKDOWN COMMENTS</B></FONT>>,
            likec4_depth=1,
            likec4_id=mdComments,
            likec4_level=0,
            margin=40,
            style=filled
        ];
        vscodeext [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">VS Code Extension Subsystem</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, VS Code Extension API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Desktop IDE extension hosting early hooks,<BR/>auth resolution, optimistic state management,<BR/>and preview integration</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        chromeext [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Chrome / Edge / Firefox Extension</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, Manifest V3, WebExtensions</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Cross-browser Manifest V3 extension injecting<BR/>comment threads onto GitHub markdown previews<BR/>and raw files</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.chromeExt",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        obsidianplugin [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Obsidian Plugin</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, Obsidian API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Obsidian Vault plugin supporting reading view<BR/>anchors, live preview gutters, and sidebar<BR/>commenting</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.obsidianPlugin",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        starlightplugin [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Astro / Starlight Plugin</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Astro, TypeScript, CSS3</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Documentation theme plugin and Astro<BR/>integration providing an interactive<BR/>slide-over comment drawer</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.starlightPlugin",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        webviewpreview [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Webview Preview Runtime</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">HTML5, CSS3, Vanilla JavaScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">In-situ markdown preview webview environment<BR/>hosting interactive comment cards, inline<BR/>badges, and sidebar drawer</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.webviewPreview",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        telemetryproxy [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Telemetry Proxy</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, Cloudflare Workers / Node.js</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Zero-secret OpenTelemetry proxy scrubbing<BR/>customer content, file paths, and author<BR/>identities</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.telemetryProxy",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        sharedengine [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Shared Domain Engine</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Core domain engine with FNV-1a anchor<BR/>hashing, fuzzy re-anchoring, Git Data API<BR/>backend, and 3-way merge logic</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.sharedEngine",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        safariext [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">macOS Safari Extension</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Swift, WebKit, Manifest V2/V3</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Native macOS Safari Web Extension packaged<BR/>with AppKit host application</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.safariExt",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        gitrefstorage [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Git Ref Data Store</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Git Ref, YAML</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Orphan git ref (refs/md-comments/data)<BR/>storing versioned YAML comments completely<BR/>outside source branches</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.gitRefStorage",
            likec4_level=1,
            margin="0.223,0",
            penwidth=2,
            shape=cylinder,
            width=4.445];
    }
    author [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Document Author</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Software engineer writing, editing, and<BR/>previewing markdown documentation</FONT></TD></TR></TABLE>>,
        likec4_id=author,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    author -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Edits markdown and previews comments in<BR/>VS Code</FONT></TD></TR></TABLE>>,
        likec4_id="1pyfxjt",
        style=dashed];
    author -> webviewpreview [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Interacts with preview drawer and<BR/>comment threads</FONT></TD></TR></TABLE>>,
        likec4_id="14b9cun",
        style=dashed];
    reviewer [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Pull Request Reviewer</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Peer engineer or technical lead reviewing<BR/>markdown documentation in PRs or local<BR/>editors</FONT></TD></TR></TABLE>>,
        likec4_id=reviewer,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    reviewer -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reviews local documentation in VS Code</FONT></TD></TR></TABLE>>,
        likec4_id=fuwgjl,
        style=dashed];
    reviewer -> chromeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reviews PR markdown files on GitHub</FONT></TD></TR></TABLE>>,
        likec4_id=r0im5z,
        style=dashed];
    aiagent [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">AI Coding Agent</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Autonomous coding agent (Antigravity, Claude<BR/>Code, Cursor) creating and resolving review<BR/>comments</FONT></TD></TR></TABLE>>,
        likec4_id=aiAgent,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    aiagent -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reads and leaves anchored comments via<BR/>agentic workflows</FONT></TD></TR></TABLE>>,
        likec4_id=o9ycpp,
        minlen=1,
        style=dashed];
    vscodeext -> webviewpreview [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="168z0xo",
        style=dashed];
    vscodeext -> telemetryproxy [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Transmits scrubbed, anonymous telemetry<BR/>payloads</FONT></TD></TR></TABLE>>,
        likec4_id="9brdt4",
        style=dashed,
        weight=2];
    vscodeext -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="3cat3g",
        style=dashed,
        weight=2];
    githubapi [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">GitHub REST &amp; GraphQL API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External GitHub API providing Git Data API<BR/>(trees, commits, refs), OAuth Device Flow,<BR/>user profiles, and commit comments</FONT></TD></TR></TABLE>>,
        likec4_id=githubApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    vscodeext -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="4xt4i9",
        style=dashed];
    chromeext -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and YAML<BR/>serialization</FONT></TD></TR></TABLE>>,
        likec4_id="13znfne",
        style=dashed,
        weight=2];
    chromeext -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Interacts with GitHub Git Data API via<BR/>Device Flow</FONT></TD></TR></TABLE>>,
        likec4_id="13x5raf",
        style=dashed];
    obsidianplugin -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and local storage</FONT></TD></TR></TABLE>>,
        likec4_id="1b4eh5d",
        minlen=1,
        style=dashed,
        weight=2];
    starlightplugin -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and client drawer</FONT></TD></TR></TABLE>>,
        likec4_id=z0am4u,
        minlen=1,
        style=dashed,
        weight=2];
    webviewpreview -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Dispatches actions (add, reply, edit,<BR/>delete, react) via postMessage</FONT></TD></TR></TABLE>>,
        likec4_id="1p96uws",
        style=dashed];
    otelbackend [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">OpenTelemetry Backend</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External telemetry ingestion endpoint<BR/>receiving scrubbed, anonymous performance and<BR/>diagnostic metrics</FONT></TD></TR></TABLE>>,
        likec4_id=otelBackend,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    telemetryproxy -> otelbackend [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Forwards sanitized telemetry spans</FONT></TD></TR></TABLE>>,
        likec4_id=ps2g7s,
        minlen=1,
        style=dashed];
    sharedengine -> gitrefstorage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reads and writes refs/md-comments/data</FONT></TD></TR></TABLE>>,
        likec4_id="1hw0rj",
        style=dashed,
        weight=2];
    sharedengine -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Fetches commit parent, base tree SHA,<BR/>and creates trees/commits</FONT></TD></TR></TABLE>>,
        likec4_id="1aryzfb",
        style=dashed];
    gitremote [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Git Remote Repository</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Upstream Git repository hosting project<BR/>source branches and the orphan<BR/>refs/md-comments/data branch</FONT></TD></TR></TABLE>>,
        likec4_id=gitRemote,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    gitrefstorage -> gitremote [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Pushed and fetched from git remote</FONT></TD></TR></TABLE>>,
        likec4_id="10o2cdd",
        minlen=1,
        style=dashed];
}
`;
      case `vscodeInternals`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=vscodeInternals,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    subgraph cluster_vscodeext {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>VS CODE EXTENSION SUBSYSTEM</B></FONT>>,
            likec4_depth=1,
            likec4_id="mdComments.vscodeExt",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        commentpreviewpanel [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Comment Preview Panel</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Native markdown preview coordinator, webview<BR/>communicator, and custom URI handler<BR/>(vscode://...)</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt.commentPreviewPanel",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        markdownitplugin [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Markdown-It Plugin</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, markdown-it</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Markdown-It parser plugin injecting anchored<BR/>comment badges, script bridges, and floating<BR/>FAB drawer widgets into the preview pipeline</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt.markdownItPlugin",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        commentactions [group="mdComments.vscodeExt",
            height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Comment Action Handler</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Action dispatch handler executing comment<BR/>additions, replies, edits, reactions, and<BR/>deletions without disruptive toasts</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt.commentActions",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        authmanager [group="mdComments.vscodeExt",
            height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Authentication Manager</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Multi-tier token resolver (Session -&gt;<BR/>context.secrets -&gt; globalState -&gt; process.env<BR/>-&gt; gh CLI -&gt; RFC 8628 Device Flow) with<BR/>onDidChangeAuthState event emitter</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt.authManager",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        commentstore [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Comment Store</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Workspace-level comment lifecycle and<BR/>persistence coordinator syncing local state<BR/>with refs/md-comments/data</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt.commentStore",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        optimisticstore [group="mdComments.vscodeExt",
            height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Optimistic Mutation Store</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">In-memory mutation store providing resilient<BR/>sequential deletions, inline edits, and<BR/>instant toggle reactions</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt.optimisticStore",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        authorresolver [group="mdComments.vscodeExt",
            height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Author Resolver</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Git config identity extractor<BR/>(user.name/user.email) and GitHub user<BR/>profile resolver with LRU caching and display<BR/>name formatting</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.vscodeExt.authorResolver",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    webviewpreview [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Webview Preview Runtime</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">HTML5, CSS3, Vanilla JavaScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">In-situ markdown preview webview environment<BR/>hosting interactive comment cards, inline<BR/>badges, and sidebar drawer</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.webviewPreview",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    commentpreviewpanel -> webviewpreview [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Hosts webview and sends initial comment<BR/>payload</FONT></TD></TR></TABLE>>,
        likec4_id=pw37a5,
        minlen=1,
        style=dashed];
    markdownitplugin -> webviewpreview [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Injects earlyHook.js, preview.css, and<BR/>preview DOM elements</FONT></TD></TR></TABLE>>,
        likec4_id="1cu5481",
        minlen=1,
        style=dashed];
    webviewpreview -> commentactions [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Dispatches actions (add, reply, edit,<BR/>delete, react) via postMessage</FONT></TD></TR></TABLE>>,
        likec4_id="9e1024",
        style=dashed];
    commentactions -> optimisticstore [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Stages mutations optimistically in<BR/>memory</FONT></TD></TR></TABLE>>,
        likec4_id="1d6a600",
        style=dashed,
        weight=2];
    authmanager -> authorresolver [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Provides authenticated GitHub client</FONT></TD></TR></TABLE>>,
        likec4_id=h50i,
        style=dashed,
        weight=3];
    githubapi [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">GitHub REST &amp; GraphQL API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External GitHub API providing Git Data API<BR/>(trees, commits, refs), OAuth Device Flow,<BR/>user profiles, and commit comments</FONT></TD></TR></TABLE>>,
        likec4_id=githubApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    authmanager -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Authenticates via OAuth Device Flow (RFC<BR/>8628)</FONT></TD></TR></TABLE>>,
        likec4_id="1s3oi5g",
        style=dashed];
    sharedengine [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Shared Domain Engine</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Core domain engine with FNV-1a anchor<BR/>hashing, fuzzy re-anchoring, Git Data API<BR/>backend, and 3-way merge logic</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.sharedEngine",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    commentstore -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="2z5zam",
        minlen=1,
        style=dashed];
    optimisticstore -> webviewpreview [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Pushes state diff to patch preview DOM<BR/>in-place</FONT></TD></TR></TABLE>>,
        likec4_id=l1qycm,
        style=dashed];
    authorresolver -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Resolves user profiles and avatars</FONT></TD></TR></TABLE>>,
        likec4_id="1uvhsi4",
        style=dashed];
    sharedengine -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Fetches commit parent, base tree SHA,<BR/>and creates trees/commits</FONT></TD></TR></TABLE>>,
        likec4_id="1aryzfb",
        minlen=0,
        style=dashed,
        weight=2];
}
`;
      case `previewInternals`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=previewInternals,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    subgraph cluster_webviewpreview {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>WEBVIEW PREVIEW RUNTIME</B></FONT>>,
            likec4_depth=1,
            likec4_id="mdComments.webviewPreview",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        {
            graph [rank=same];
            confirmationmodal [height=2.5,
                label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">In-Webview Confirmation Modal</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Vanilla JavaScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">In-webview confirmation modal<BR/>(showConfirmationModal) providing resilient<BR/>deletion approval without disruptive native<BR/>input boxes</FONT></TD></TR></TABLE>>,
                likec4_id="mdComments.webviewPreview.confirmationModal",
                likec4_level=1,
                margin="0.223,0.223",
                width=4.445];
            mutationguard [height=2.5,
                label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">MutationObserver Guard</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Vanilla JavaScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Debounced MutationObserver with strict text<BR/>content equality checks guarding badge<BR/>counters against recursive 100% CPU loops</FONT></TD></TR></TABLE>>,
                likec4_id="mdComments.webviewPreview.mutationGuard",
                likec4_level=1,
                margin="0.223,0.223",
                width=4.445];
        }
        earlyhook [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Early Bootstrap Hook</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Vanilla JavaScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Synchronous pre-bootstrap hook (earlyHook.js)<BR/>caching acquireVsCodeApi(), polyfilling<BR/>poster, and queueing action dispatches prior<BR/>to module execution</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.webviewPreview.earlyHook",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        inplacedomupdater [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">In-Place DOM Patcher</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Vanilla JavaScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">In-place DOM patcher (preview-webview.js,<BR/>preview.js) updating comment cards, badges,<BR/>and threads without reloading document DOM</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.webviewPreview.inplaceDomUpdater",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        inlineanchors [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Inline Anchors &amp; FAB</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Vanilla JavaScript, CSS3</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Document text anchor highlighter, gutter<BR/>indicators, and floating MD FAB drawer widget</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.webviewPreview.inlineAnchors",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        confirmationmodal -> inlineanchors [style=invis];
    }
    vscodeext [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">VS Code Extension Subsystem</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, VS Code Extension API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Desktop IDE extension hosting early hooks,<BR/>auth resolution, optimistic state management,<BR/>and preview integration</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.vscodeExt",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    earlyhook -> vscodeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Dispatches actions (add, reply, edit,<BR/>delete, react) via postMessage</FONT></TD></TR></TABLE>>,
        likec4_id="1lvmmtu",
        style=dashed];
    vscodeext -> earlyhook [arrowhead=normal,
        lhead=cluster_webviewpreview,
        likec4_id="168z0xo",
        style=dashed,
        weight=2,
        xlabel=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>];
    vscodeext -> inplacedomupdater [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Pushes state diff to patch preview DOM<BR/>in-place</FONT></TD></TR></TABLE>>,
        likec4_id="1whayi3",
        minlen=1,
        style=dashed];
}
`;
      case `browserInternals`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=browserInternals,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    reviewer [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Pull Request Reviewer</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Peer engineer or technical lead reviewing<BR/>markdown documentation in PRs or local<BR/>editors</FONT></TD></TR></TABLE>>,
        likec4_id=reviewer,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    chromeext [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Chrome / Edge / Firefox Extension</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, Manifest V3, WebExtensions</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Cross-browser Manifest V3 extension injecting<BR/>comment threads onto GitHub markdown previews<BR/>and raw files</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.chromeExt",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    reviewer -> chromeext [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reviews PR markdown files on GitHub</FONT></TD></TR></TABLE>>,
        likec4_id=r0im5z,
        minlen=1,
        style=dashed];
    sharedengine [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Shared Domain Engine</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Core domain engine with FNV-1a anchor<BR/>hashing, fuzzy re-anchoring, Git Data API<BR/>backend, and 3-way merge logic</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.sharedEngine",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    chromeext -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and YAML<BR/>serialization</FONT></TD></TR></TABLE>>,
        likec4_id="13znfne",
        style=dashed,
        weight=2];
    githubapi [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">GitHub REST &amp; GraphQL API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External GitHub API providing Git Data API<BR/>(trees, commits, refs), OAuth Device Flow,<BR/>user profiles, and commit comments</FONT></TD></TR></TABLE>>,
        likec4_id=githubApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    chromeext -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Interacts with GitHub Git Data API via<BR/>Device Flow</FONT></TD></TR></TABLE>>,
        likec4_id="13x5raf",
        style=dashed];
    sharedengine -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Fetches commit parent, base tree SHA,<BR/>and creates trees/commits</FONT></TD></TR></TABLE>>,
        likec4_id="1aryzfb",
        style=dashed];
}
`;
      case `sharedInternals`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=sharedInternals,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    subgraph cluster_sharedengine {
        graph [color="#1b3d88",
            fillcolor="#194b9e",
            label=<<FONT POINT-SIZE="11" COLOR="#bfdbfeb3"><B>SHARED DOMAIN ENGINE</B></FONT>>,
            likec4_depth=1,
            likec4_id="mdComments.sharedEngine",
            likec4_level=0,
            margin=40,
            style=filled
        ];
        gitrefbackend [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Git Ref Storage Backend</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Git Data API orphan ref backend with base<BR/>tree SHA resolution (GET /git/commits/:sha -&gt;<BR/>tree.sha), 3-way merge, and commit comment<BR/>notifications</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.sharedEngine.gitRefBackend",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        localfilebackend [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Local File Backend</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Local sidecar YAML storage backend for<BR/>non-git workspaces and offline evaluation</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.sharedEngine.localFileBackend",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
        anchorengine [height=2.5,
            label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">FNV-1a Anchoring Engine</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">FNV-1a hash anchoring algorithm with<BR/>surrounding context window and normalized<BR/>fuzzy search fallback cascade</FONT></TD></TR></TABLE>>,
            likec4_id="mdComments.sharedEngine.anchorEngine",
            likec4_level=1,
            margin="0.223,0.223",
            width=4.445];
    }
    vscodeext [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">VS Code Extension Subsystem</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, VS Code Extension API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Desktop IDE extension hosting early hooks,<BR/>auth resolution, optimistic state management,<BR/>and preview integration</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.vscodeExt",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    vscodeext -> gitrefbackend [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Synchronizes threads with Git backend</FONT></TD></TR></TABLE>>,
        likec4_id=hpwr3h,
        style=dashed,
        weight=2];
    vscodeext -> localfilebackend [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Persists threads to local YAML when<BR/>offline</FONT></TD></TR></TABLE>>,
        likec4_id=rak1vx,
        minlen=1,
        style=dashed];
    githubapi [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">GitHub REST &amp; GraphQL API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">External GitHub API providing Git Data API<BR/>(trees, commits, refs), OAuth Device Flow,<BR/>user profiles, and commit comments</FONT></TD></TR></TABLE>>,
        likec4_id=githubApi,
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    vscodeext -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14"><B>[...]</B></FONT></TD></TR></TABLE>>,
        likec4_id="4xt4i9",
        minlen=0,
        style=dashed,
        weight=2];
    gitrefbackend -> githubapi [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Fetches commit parent, base tree SHA,<BR/>and creates trees/commits</FONT></TD></TR></TABLE>>,
        likec4_id="1alndfa",
        style=dashed];
    gitrefstorage [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Git Ref Data Store</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Git Ref, YAML</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Orphan git ref (refs/md-comments/data)<BR/>storing versioned YAML comments completely<BR/>outside source branches</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.gitRefStorage",
        likec4_level=0,
        margin="0.223,0",
        penwidth=2,
        shape=cylinder,
        width=4.445];
    gitrefbackend -> gitrefstorage [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Reads and writes refs/md-comments/data</FONT></TD></TR></TABLE>>,
        likec4_id="8lm3tq",
        minlen=1,
        style=dashed,
        weight=2];
}
`;
      case `starlightInternals`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=starlightInternals,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    starlightplugin [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Astro / Starlight Plugin</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">Astro, TypeScript, CSS3</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Documentation theme plugin and Astro<BR/>integration providing an interactive<BR/>slide-over comment drawer</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.starlightPlugin",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sharedengine [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Shared Domain Engine</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Core domain engine with FNV-1a anchor<BR/>hashing, fuzzy re-anchoring, Git Data API<BR/>backend, and 3-way merge logic</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.sharedEngine",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    starlightplugin -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and client drawer</FONT></TD></TR></TABLE>>,
        likec4_id=z0am4u,
        style=dashed];
}
`;
      case `obsidianInternals`:
        return `digraph {
    graph [TBbalance=min,
        bgcolor=transparent,
        compound=true,
        fontname=Arial,
        fontsize=20,
        labeljust=l,
        labelloc=t,
        layout=dot,
        likec4_viewId=obsidianInternals,
        nodesep=1.528,
        outputorder=nodesfirst,
        pad=0.209,
        rankdir=TB,
        ranksep=1.667,
        splines=spline
    ];
    node [color="#2563eb",
        fillcolor="#3b82f6",
        fontcolor="#eff6ff",
        fontname=Arial,
        penwidth=0,
        shape=rect,
        style=filled
    ];
    edge [arrowsize=0.75,
        color="#8D8D8D",
        fontcolor="#C9C9C9",
        fontname=Arial,
        fontsize=14,
        penwidth=2,
        style=""
    ];
    obsidianplugin [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Obsidian Plugin</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript, Obsidian API</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Obsidian Vault plugin supporting reading view<BR/>anchors, live preview gutters, and sidebar<BR/>commenting</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.obsidianPlugin",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    sharedengine [height=2.5,
        label=<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD><FONT POINT-SIZE="20">Shared Domain Engine</FONT></TD></TR><TR><TD><FONT POINT-SIZE="13" COLOR="#bfdbfe">TypeScript</FONT></TD></TR><TR><TD><FONT POINT-SIZE="15" COLOR="#bfdbfe">Core domain engine with FNV-1a anchor<BR/>hashing, fuzzy re-anchoring, Git Data API<BR/>backend, and 3-way merge logic</FONT></TD></TR></TABLE>>,
        likec4_id="mdComments.sharedEngine",
        likec4_level=0,
        margin="0.223,0.223",
        width=4.445];
    obsidianplugin -> sharedengine [arrowhead=normal,
        label=<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" BGCOLOR="#18191BA0"><TR><TD ALIGN="TEXT" BALIGN="LEFT"><FONT POINT-SIZE="14">Uses anchor matching and local storage</FONT></TD></TR></TABLE>>,
        likec4_id="1b4eh5d",
        style=dashed];
}
`;
      default:
        throw Error(`Unknown viewId: ` + e);
    }
  },
  t = (e) => {
    switch (e) {
      case `index`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1697pt" height="872pt"
 viewBox="0.00 0.00 1697.00 872.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 857.45)">
<!-- author -->
<g id="node1" class="node">
<title>author</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="326.47,-842.4 6.43,-842.4 6.43,-662.4 326.47,-662.4 326.47,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="88.64" y="-764.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Document Author</text>
<text xml:space="preserve" text-anchor="start" x="38.88" y="-741.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">Software engineer writing, editing, and</text>
<text xml:space="preserve" text-anchor="start" x="42.64" y="-723.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">previewing markdown documentation</text>
</g>
<!-- mdcomments -->
<g id="node2" class="node">
<title>mdcomments</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="782.82,-502.8 410.09,-502.8 410.09,-322.8 782.82,-322.8 782.82,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="499.2" y="-433.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Markdown Comments</text>
<text xml:space="preserve" text-anchor="start" x="465.57" y="-410.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Multi&#45;platform, local&#45;first documentation</text>
<text xml:space="preserve" text-anchor="start" x="430.14" y="-392.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">review and commenting system storing comments</text>
<text xml:space="preserve" text-anchor="start" x="514.74" y="-374.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">outside source branches</text>
</g>
<!-- reviewer -->
<g id="node3" class="node">
<title>reviewer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="756.47,-842.4 436.43,-842.4 436.43,-662.4 756.47,-662.4 756.47,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="495.3" y="-773.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Pull Request Reviewer</text>
<text xml:space="preserve" text-anchor="start" x="458.87" y="-750.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">Peer engineer or technical lead reviewing</text>
<text xml:space="preserve" text-anchor="start" x="460.14" y="-732.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">markdown documentation in PRs or local</text>
<text xml:space="preserve" text-anchor="start" x="573.94" y="-714.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">editors</text>
</g>
<!-- aiagent -->
<g id="node4" class="node">
<title>aiagent</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1216.19,-842.4 866.72,-842.4 866.72,-662.4 1216.19,-662.4 1216.19,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="968.63" y="-773.4" font-family="Arial" font-size="20.00" fill="#eff6ff">AI Coding Agent</text>
<text xml:space="preserve" text-anchor="start" x="886.78" y="-750.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">Autonomous coding agent (Antigravity, Claude</text>
<text xml:space="preserve" text-anchor="start" x="895.14" y="-732.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">Code, Cursor) creating and resolving review</text>
<text xml:space="preserve" text-anchor="start" x="1006.86" y="-714.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">comments</text>
</g>
<!-- browserregistries -->
<g id="node5" class="node">
<title>browserregistries</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1666.99,-842.4 1325.92,-842.4 1325.92,-662.4 1666.99,-662.4 1666.99,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="1365.85" y="-764.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Browser Extension Registries</text>
<text xml:space="preserve" text-anchor="start" x="1345.97" y="-741.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">Chrome Web Store, Microsoft Edge Add&#45;ons,</text>
<text xml:space="preserve" text-anchor="start" x="1369.71" y="-723.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">Mozilla Add&#45;ons, and Apple App Store</text>
</g>
<!-- githubapi -->
<g id="node6" class="node">
<title>githubapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="326.91,-180 0,-180 0,0 326.91,0 326.91,-180"/>
<text xml:space="preserve" text-anchor="start" x="30.63" y="-111" font-family="Arial" font-size="20.00" fill="#eff6ff">GitHub REST &amp; GraphQL API</text>
<text xml:space="preserve" text-anchor="start" x="20.06" y="-88" font-family="Arial" font-size="15.00" fill="#bfdbfe">External GitHub API providing Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="22.59" y="-70" font-family="Arial" font-size="15.00" fill="#bfdbfe">(trees, commits, refs), OAuth Device Flow,</text>
<text xml:space="preserve" text-anchor="start" x="43" y="-52" font-family="Arial" font-size="15.00" fill="#bfdbfe">user profiles, and commit comments</text>
</g>
<!-- gitremote -->
<g id="node7" class="node">
<title>gitremote</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="756.47,-180 436.43,-180 436.43,0 756.47,0 756.47,-180"/>
<text xml:space="preserve" text-anchor="start" x="495.31" y="-111" font-family="Arial" font-size="20.00" fill="#eff6ff">Git Remote Repository</text>
<text xml:space="preserve" text-anchor="start" x="466.4" y="-88" font-family="Arial" font-size="15.00" fill="#bfdbfe">Upstream Git repository hosting project</text>
<text xml:space="preserve" text-anchor="start" x="488.46" y="-70" font-family="Arial" font-size="15.00" fill="#bfdbfe">source branches and the orphan</text>
<text xml:space="preserve" text-anchor="start" x="492.66" y="-52" font-family="Arial" font-size="15.00" fill="#bfdbfe">refs/md&#45;comments/data branch</text>
</g>
<!-- otelbackend -->
<g id="node8" class="node">
<title>otelbackend</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1236.19,-180 866.72,-180 866.72,0 1236.19,0 1236.19,-180"/>
<text xml:space="preserve" text-anchor="start" x="940.84" y="-111" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Backend</text>
<text xml:space="preserve" text-anchor="start" x="928.05" y="-88" font-family="Arial" font-size="15.00" fill="#bfdbfe">External telemetry ingestion endpoint</text>
<text xml:space="preserve" text-anchor="start" x="886.78" y="-70" font-family="Arial" font-size="15.00" fill="#bfdbfe">receiving scrubbed, anonymous performance and</text>
<text xml:space="preserve" text-anchor="start" x="991.43" y="-52" font-family="Arial" font-size="15.00" fill="#bfdbfe">diagnostic metrics</text>
</g>
<!-- author&#45;&gt;mdcomments -->
<g id="edge1" class="edge">
<title>author&#45;&gt;mdcomments</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M279.71,-662.48C339.84,-615.27 413.77,-557.23 475.07,-509.1"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="476.59,-511.24 480.87,-504.54 473.35,-507.11 476.59,-511.24"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="394.35,-571.2 394.35,-594 421.34,-594 421.34,-571.2 394.35,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="397.35" y="-579.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- mdcomments&#45;&gt;githubapi -->
<g id="edge4" class="edge">
<title>mdcomments&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M476.41,-322.87C418.92,-280.27 350.03,-229.23 291.53,-185.89"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="293.37,-183.99 285.78,-181.63 290.25,-188.21 293.37,-183.99"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="392.94,-240 392.94,-262.8 419.93,-262.8 419.93,-240 392.94,-240"/>
<text xml:space="preserve" text-anchor="start" x="395.94" y="-248.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- mdcomments&#45;&gt;gitremote -->
<g id="edge5" class="edge">
<title>mdcomments&#45;&gt;gitremote</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M596.45,-322.87C596.45,-281.67 596.45,-232.56 596.45,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="599.08,-190.36 596.45,-182.86 593.83,-190.36 599.08,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="596.45,-240 596.45,-262.8 825.02,-262.8 825.02,-240 596.45,-240"/>
<text xml:space="preserve" text-anchor="start" x="599.45" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Pushed and fetched from git remote</text>
</g>
<!-- mdcomments&#45;&gt;otelbackend -->
<g id="edge6" class="edge">
<title>mdcomments&#45;&gt;otelbackend</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M759.77,-322.83C791.19,-304.02 823.36,-283.56 852.45,-262.8 884.69,-239.81 917.92,-212.67 947.79,-186.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="949.49,-188.84 953.42,-181.93 946.04,-184.87 949.49,-188.84"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="881.14,-240 881.14,-262.8 1107.34,-262.8 1107.34,-240 881.14,-240"/>
<text xml:space="preserve" text-anchor="start" x="884.14" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Forwards sanitized telemetry spans</text>
</g>
<!-- reviewer&#45;&gt;mdcomments -->
<g id="edge2" class="edge">
<title>reviewer&#45;&gt;mdcomments</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M596.45,-662.7C596.45,-616.74 596.45,-560.47 596.45,-513.07"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="599.08,-513.31 596.45,-505.81 593.83,-513.31 599.08,-513.31"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="596.45,-571.2 596.45,-594 623.45,-594 623.45,-571.2 596.45,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="599.45" y="-579.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- aiagent&#45;&gt;mdcomments -->
<g id="edge3" class="edge">
<title>aiagent&#45;&gt;mdcomments</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M924.24,-662.48C861.89,-615.17 785.2,-556.99 721.68,-508.8"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="723.57,-506.95 716.01,-504.5 720.4,-511.13 723.57,-506.95"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="832.3,-562.8 832.3,-602.4 1102.89,-602.4 1102.89,-562.8 832.3,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="835.3" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reads and leaves anchored comments via</text>
<text xml:space="preserve" text-anchor="start" x="835.3" y="-568.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">agentic workflows</text>
</g>
</g>
</svg>
`;
      case `systemContext`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3395pt" height="1561pt"
 viewBox="0.00 0.00 3395.00 1561.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1545.85)">
<g id="clust1" class="cluster">
<title>cluster_mdcomments</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="846.45,-282.8 846.45,-1243.2 3103.45,-1243.2 3103.45,-282.8 846.45,-282.8"/>
<text xml:space="preserve" text-anchor="start" x="854.45" y="-1230.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">MARKDOWN COMMENTS</text>
</g>
<!-- vscodeext -->
<g id="node1" class="node">
<title>vscodeext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2599.42,-1182 2257.49,-1182 2257.49,-1002 2599.42,-1002 2599.42,-1182"/>
<text xml:space="preserve" text-anchor="start" x="2289.49" y="-1122.8" font-family="Arial" font-size="20.00" fill="#eff6ff">VS Code Extension Subsystem</text>
<text xml:space="preserve" text-anchor="start" x="2325.13" y="-1101.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, VS Code Extension API</text>
<text xml:space="preserve" text-anchor="start" x="2283.38" y="-1080.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Desktop IDE extension hosting early hooks,</text>
<text xml:space="preserve" text-anchor="start" x="2277.54" y="-1062.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">auth resolution, optimistic state management,</text>
<text xml:space="preserve" text-anchor="start" x="2350.9" y="-1044.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">and preview integration</text>
</g>
<!-- chromeext -->
<g id="node2" class="node">
<title>chromeext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1262.91,-1182 885.99,-1182 885.99,-1002 1262.91,-1002 1262.91,-1182"/>
<text xml:space="preserve" text-anchor="start" x="921.61" y="-1122.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Chrome / Edge / Firefox Extension</text>
<text xml:space="preserve" text-anchor="start" x="956.68" y="-1101.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, Manifest V3, WebExtensions</text>
<text xml:space="preserve" text-anchor="start" x="920.22" y="-1080.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Cross&#45;browser Manifest V3 extension injecting</text>
<text xml:space="preserve" text-anchor="start" x="906.05" y="-1062.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">comment threads onto GitHub markdown previews</text>
<text xml:space="preserve" text-anchor="start" x="1032.35" y="-1044.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">and raw files</text>
</g>
<!-- obsidianplugin -->
<g id="node3" class="node">
<title>obsidianplugin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1717.69,-1182 1373.22,-1182 1373.22,-1002 1717.69,-1002 1717.69,-1182"/>
<text xml:space="preserve" text-anchor="start" x="1475.41" y="-1122.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Obsidian Plugin</text>
<text xml:space="preserve" text-anchor="start" x="1472.84" y="-1101.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, Obsidian API</text>
<text xml:space="preserve" text-anchor="start" x="1393.27" y="-1080.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Obsidian Vault plugin supporting reading view</text>
<text xml:space="preserve" text-anchor="start" x="1407.05" y="-1062.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">anchors, live preview gutters, and sidebar</text>
<text xml:space="preserve" text-anchor="start" x="1504.6" y="-1044.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">commenting</text>
</g>
<!-- starlightplugin -->
<g id="node4" class="node">
<title>starlightplugin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2147.47,-1182 1827.43,-1182 1827.43,-1002 2147.47,-1002 2147.47,-1182"/>
<text xml:space="preserve" text-anchor="start" x="1888.52" y="-1122.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Astro / Starlight Plugin</text>
<text xml:space="preserve" text-anchor="start" x="1917.01" y="-1101.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Astro, TypeScript, CSS3</text>
<text xml:space="preserve" text-anchor="start" x="1857.79" y="-1080.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Documentation theme plugin and Astro</text>
<text xml:space="preserve" text-anchor="start" x="1873.22" y="-1062.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">integration providing an interactive</text>
<text xml:space="preserve" text-anchor="start" x="1897.01" y="-1044.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">slide&#45;over comment drawer</text>
</g>
<!-- webviewpreview -->
<g id="node5" class="node">
<title>webviewpreview</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3014.74,-842.4 2656.17,-842.4 2656.17,-662.4 3014.74,-662.4 3014.74,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="2716.53" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Webview Preview Runtime</text>
<text xml:space="preserve" text-anchor="start" x="2738.28" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">HTML5, CSS3, Vanilla JavaScript</text>
<text xml:space="preserve" text-anchor="start" x="2676.22" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">In&#45;situ markdown preview webview environment</text>
<text xml:space="preserve" text-anchor="start" x="2699.97" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">hosting interactive comment cards, inline</text>
<text xml:space="preserve" text-anchor="start" x="2742.48" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">badges, and sidebar drawer</text>
</g>
<!-- telemetryproxy -->
<g id="node6" class="node">
<title>telemetryproxy</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2474.65,-842.4 2140.26,-842.4 2140.26,-662.4 2474.65,-662.4 2474.65,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="2234.66" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Telemetry Proxy</text>
<text xml:space="preserve" text-anchor="start" x="2189.69" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, Cloudflare Workers / Node.js</text>
<text xml:space="preserve" text-anchor="start" x="2160.31" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Zero&#45;secret OpenTelemetry proxy scrubbing</text>
<text xml:space="preserve" text-anchor="start" x="2175.71" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">customer content, file paths, and author</text>
<text xml:space="preserve" text-anchor="start" x="2277.85" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">identities</text>
</g>
<!-- sharedengine -->
<g id="node7" class="node">
<title>sharedengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1621.47,-842.4 1301.43,-842.4 1301.43,-662.4 1621.47,-662.4 1621.47,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="1358.05" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared Domain Engine</text>
<text xml:space="preserve" text-anchor="start" x="1430.39" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="1325.55" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Core domain engine with FNV&#45;1a anchor</text>
<text xml:space="preserve" text-anchor="start" x="1323.47" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">hashing, fuzzy re&#45;anchoring, Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="1353.48" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">backend, and 3&#45;way merge logic</text>
</g>
<!-- safariext -->
<g id="node8" class="node">
<title>safariext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3063.67,-1182 2709.24,-1182 2709.24,-1002 3063.67,-1002 3063.67,-1182"/>
<text xml:space="preserve" text-anchor="start" x="2777.52" y="-1113.8" font-family="Arial" font-size="20.00" fill="#eff6ff">macOS Safari Extension</text>
<text xml:space="preserve" text-anchor="start" x="2800.12" y="-1092.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Swift, WebKit, Manifest V2/V3</text>
<text xml:space="preserve" text-anchor="start" x="2729.29" y="-1071.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Native macOS Safari Web Extension packaged</text>
<text xml:space="preserve" text-anchor="start" x="2794.73" y="-1053.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">with AppKit host application</text>
</g>
<!-- gitrefstorage -->
<g id="node9" class="node">
<title>gitrefstorage</title>
<path fill="#3b82f6" stroke="#2563eb" stroke-width="2" d="M1635.74,-486.44C1635.74,-495.47 1557.62,-502.8 1461.45,-502.8 1365.29,-502.8 1287.17,-495.47 1287.17,-486.44 1287.17,-486.44 1287.17,-339.16 1287.17,-339.16 1287.17,-330.13 1365.29,-322.8 1461.45,-322.8 1557.62,-322.8 1635.74,-330.13 1635.74,-339.16 1635.74,-339.16 1635.74,-486.44 1635.74,-486.44"/>
<path fill="none" stroke="#2563eb" stroke-width="2" d="M1635.74,-486.44C1635.74,-477.41 1557.62,-470.07 1461.45,-470.07 1365.29,-470.07 1287.17,-477.41 1287.17,-486.44"/>
<text xml:space="preserve" text-anchor="start" x="1379.75" y="-443.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Git Ref Data Store</text>
<text xml:space="preserve" text-anchor="start" x="1419.91" y="-422.6" font-family="Arial" font-size="13.00" fill="#bfdbfe">Git Ref, YAML</text>
<text xml:space="preserve" text-anchor="start" x="1329.74" y="-401" font-family="Arial" font-size="15.00" fill="#bfdbfe">Orphan git ref (refs/md&#45;comments/data)</text>
<text xml:space="preserve" text-anchor="start" x="1307.22" y="-383" font-family="Arial" font-size="15.00" fill="#bfdbfe">storing versioned YAML comments completely</text>
<text xml:space="preserve" text-anchor="start" x="1379.74" y="-365" font-family="Arial" font-size="15.00" fill="#bfdbfe">outside source branches</text>
</g>
<!-- author -->
<g id="node10" class="node">
<title>author</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3256.47,-1530.8 2936.43,-1530.8 2936.43,-1350.8 3256.47,-1350.8 3256.47,-1530.8"/>
<text xml:space="preserve" text-anchor="start" x="3018.64" y="-1452.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Document Author</text>
<text xml:space="preserve" text-anchor="start" x="2968.88" y="-1429.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Software engineer writing, editing, and</text>
<text xml:space="preserve" text-anchor="start" x="2972.64" y="-1411.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">previewing markdown documentation</text>
</g>
<!-- reviewer -->
<g id="node11" class="node">
<title>reviewer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1997.47,-1530.8 1677.43,-1530.8 1677.43,-1350.8 1997.47,-1350.8 1997.47,-1530.8"/>
<text xml:space="preserve" text-anchor="start" x="1736.3" y="-1461.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Pull Request Reviewer</text>
<text xml:space="preserve" text-anchor="start" x="1699.87" y="-1438.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Peer engineer or technical lead reviewing</text>
<text xml:space="preserve" text-anchor="start" x="1701.14" y="-1420.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">markdown documentation in PRs or local</text>
<text xml:space="preserve" text-anchor="start" x="1814.94" y="-1402.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">editors</text>
</g>
<!-- aiagent -->
<g id="node12" class="node">
<title>aiagent</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2603.19,-1530.8 2253.72,-1530.8 2253.72,-1350.8 2603.19,-1350.8 2603.19,-1530.8"/>
<text xml:space="preserve" text-anchor="start" x="2355.63" y="-1461.8" font-family="Arial" font-size="20.00" fill="#eff6ff">AI Coding Agent</text>
<text xml:space="preserve" text-anchor="start" x="2273.78" y="-1438.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Autonomous coding agent (Antigravity, Claude</text>
<text xml:space="preserve" text-anchor="start" x="2282.14" y="-1420.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Code, Cursor) creating and resolving review</text>
<text xml:space="preserve" text-anchor="start" x="2393.86" y="-1402.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">comments</text>
</g>
<!-- githubapi -->
<g id="node13" class="node">
<title>githubapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="326.91,-502.8 0,-502.8 0,-322.8 326.91,-322.8 326.91,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="30.63" y="-433.8" font-family="Arial" font-size="20.00" fill="#eff6ff">GitHub REST &amp; GraphQL API</text>
<text xml:space="preserve" text-anchor="start" x="20.06" y="-410.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">External GitHub API providing Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="22.59" y="-392.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">(trees, commits, refs), OAuth Device Flow,</text>
<text xml:space="preserve" text-anchor="start" x="43" y="-374.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">user profiles, and commit comments</text>
</g>
<!-- otelbackend -->
<g id="node14" class="node">
<title>otelbackend</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="806.19,-502.8 436.72,-502.8 436.72,-322.8 806.19,-322.8 806.19,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="510.84" y="-433.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Backend</text>
<text xml:space="preserve" text-anchor="start" x="498.05" y="-410.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">External telemetry ingestion endpoint</text>
<text xml:space="preserve" text-anchor="start" x="456.78" y="-392.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">receiving scrubbed, anonymous performance and</text>
<text xml:space="preserve" text-anchor="start" x="561.43" y="-374.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">diagnostic metrics</text>
</g>
<!-- gitremote -->
<g id="node15" class="node">
<title>gitremote</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1621.47,-180 1301.43,-180 1301.43,0 1621.47,0 1621.47,-180"/>
<text xml:space="preserve" text-anchor="start" x="1360.31" y="-111" font-family="Arial" font-size="20.00" fill="#eff6ff">Git Remote Repository</text>
<text xml:space="preserve" text-anchor="start" x="1331.4" y="-88" font-family="Arial" font-size="15.00" fill="#bfdbfe">Upstream Git repository hosting project</text>
<text xml:space="preserve" text-anchor="start" x="1353.46" y="-70" font-family="Arial" font-size="15.00" fill="#bfdbfe">source branches and the orphan</text>
<text xml:space="preserve" text-anchor="start" x="1357.66" y="-52" font-family="Arial" font-size="15.00" fill="#bfdbfe">refs/md&#45;comments/data branch</text>
</g>
<!-- vscodeext&#45;&gt;webviewpreview -->
<g id="edge6" class="edge">
<title>vscodeext&#45;&gt;webviewpreview</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2535.65,-1002.08C2592.45,-954.97 2662.25,-897.07 2720.21,-848.99"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2721.88,-851.02 2725.98,-844.21 2718.53,-846.98 2721.88,-851.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2644.16,-910.8 2644.16,-933.6 2671.15,-933.6 2671.15,-910.8 2644.16,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="2647.16" y="-919" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- vscodeext&#45;&gt;telemetryproxy -->
<g id="edge7" class="edge">
<title>vscodeext&#45;&gt;telemetryproxy</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2323.28,-1002C2308.02,-983.83 2294.57,-963.6 2285.9,-942 2274.7,-914.09 2274.22,-882.12 2278.25,-852.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2280.83,-852.97 2279.39,-845.16 2275.65,-852.17 2280.83,-852.97"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2285.9,-902.4 2285.9,-942 2556.45,-942 2556.45,-902.4 2285.9,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="2288.9" y="-925" font-family="Arial" font-size="14.00" fill="#c9c9c9">Transmits scrubbed, anonymous telemetry</text>
<text xml:space="preserve" text-anchor="start" x="2288.9" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">payloads</text>
</g>
<!-- vscodeext&#45;&gt;sharedengine -->
<g id="edge8" class="edge">
<title>vscodeext&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2257.85,-1003.38C2186.6,-968.95 2102.21,-930.93 2023.45,-902.4 1894.48,-855.69 1744.06,-816.58 1631.31,-790.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1632.06,-787.65 1624.16,-788.5 1630.87,-792.76 1632.06,-787.65"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2114.47,-910.8 2114.47,-933.6 2141.46,-933.6 2141.46,-910.8 2114.47,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="2117.47" y="-919" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- vscodeext&#45;&gt;githubapi -->
<g id="edge9" class="edge">
<title>vscodeext&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2257.8,-1017.22C2239.37,-1011.24 2220.68,-1005.98 2202.45,-1002 1722.78,-897.38 1570.73,-1079.59 1099.45,-942 783.79,-849.84 459.14,-634.24 287.49,-508.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="289.22,-506.85 281.62,-504.54 286.12,-511.09 289.22,-506.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="826.04,-741 826.04,-763.8 853.03,-763.8 853.03,-741 826.04,-741"/>
<text xml:space="preserve" text-anchor="start" x="829.04" y="-749.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- chromeext&#45;&gt;sharedengine -->
<g id="edge10" class="edge">
<title>chromeext&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1096.58,-1002.2C1108.68,-967.79 1126.71,-930.1 1152.9,-902.4 1191.02,-862.1 1242.3,-831.39 1292.1,-808.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1293.17,-811.03 1298.94,-805.57 1291.02,-806.24 1293.17,-811.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1152.9,-902.4 1152.9,-942 1367.45,-942 1367.45,-902.4 1152.9,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="1155.9" y="-925" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and YAML</text>
<text xml:space="preserve" text-anchor="start" x="1155.9" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">serialization</text>
</g>
<!-- chromeext&#45;&gt;githubapi -->
<g id="edge11" class="edge">
<title>chromeext&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M886.16,-1062.9C657.37,-1024.56 291.38,-948.33 207.03,-842.4 133.2,-749.67 134.08,-607.5 145.46,-512.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="148.03,-513.24 146.37,-505.47 142.83,-512.58 148.03,-513.24"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="207.03,-732.6 207.03,-772.2 446.45,-772.2 446.45,-732.6 207.03,-732.6"/>
<text xml:space="preserve" text-anchor="start" x="210.03" y="-755.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Interacts with GitHub Git Data API via</text>
<text xml:space="preserve" text-anchor="start" x="210.03" y="-738.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Device Flow</text>
</g>
<!-- obsidianplugin&#45;&gt;sharedengine -->
<g id="edge12" class="edge">
<title>obsidianplugin&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1439.37,-1002.12C1423.98,-983.94 1410.4,-963.67 1401.65,-942 1390.03,-913.24 1394.05,-881.31 1404.12,-852.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1406.56,-852.98 1406.7,-845.03 1401.64,-851.15 1406.56,-852.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1401.65,-910.8 1401.65,-933.6 1657.45,-933.6 1657.45,-910.8 1401.65,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="1404.65" y="-916.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and local storage</text>
</g>
<!-- starlightplugin&#45;&gt;sharedengine -->
<g id="edge13" class="edge">
<title>starlightplugin&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1848.91,-1002.08C1774.91,-954.58 1683.82,-896.12 1608.55,-847.81"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1610.2,-845.75 1602.47,-843.91 1607.37,-850.17 1610.2,-845.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1740.22,-910.8 1740.22,-933.6 1996.02,-933.6 1996.02,-910.8 1740.22,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="1743.22" y="-916.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and client drawer</text>
</g>
<!-- webviewpreview&#45;&gt;vscodeext -->
<g id="edge14" class="edge">
<title>webviewpreview&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2782.91,-842.05C2759.9,-876.04 2730.76,-913.47 2698.45,-942 2671.4,-965.89 2639.87,-987.53 2608.1,-1006.45"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2606.89,-1004.12 2601.75,-1010.18 2609.55,-1008.65 2606.89,-1004.12"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2734.15,-902.4 2734.15,-942 2961.93,-942 2961.93,-902.4 2734.15,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="2737.15" y="-925" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispatches actions (add, reply, edit,</text>
<text xml:space="preserve" text-anchor="start" x="2737.15" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">delete, react) via postMessage</text>
</g>
<!-- telemetryproxy&#45;&gt;otelbackend -->
<g id="edge15" class="edge">
<title>telemetryproxy&#45;&gt;otelbackend</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2140.47,-727.26C2013.32,-709.02 1833.93,-683.6 1676.45,-662.4 1292.48,-610.72 1185.15,-630.77 819.45,-502.8 818.2,-502.36 816.95,-501.92 815.69,-501.47"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="816.81,-499.08 808.86,-498.99 815.01,-504.02 816.81,-499.08"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1183.14,-571.2 1183.14,-594 1409.34,-594 1409.34,-571.2 1183.14,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1186.14" y="-577" font-family="Arial" font-size="14.00" fill="#c9c9c9">Forwards sanitized telemetry spans</text>
</g>
<!-- sharedengine&#45;&gt;gitrefstorage -->
<g id="edge16" class="edge">
<title>sharedengine&#45;&gt;gitrefstorage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1461.45,-662.7C1461.45,-617.02 1461.45,-561.14 1461.45,-513.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1464.08,-514.19 1461.45,-506.69 1458.83,-514.2 1464.08,-514.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1461.45,-571.2 1461.45,-594 1726.56,-594 1726.56,-571.2 1461.45,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1464.45" y="-577" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reads and writes refs/md&#45;comments/data</text>
</g>
<!-- sharedengine&#45;&gt;githubapi -->
<g id="edge17" class="edge">
<title>sharedengine&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1301.56,-728.42C1152.22,-704.69 924.18,-662.63 732.35,-602.4 689.92,-589.08 682.71,-576.67 640.45,-562.8 528.19,-525.94 494.07,-538.58 381.45,-502.8 366.61,-498.08 351.36,-492.8 336.15,-487.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="337.47,-484.92 329.53,-484.77 335.65,-489.84 337.47,-484.92"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="732.35,-562.8 732.35,-602.4 983.45,-602.4 983.45,-562.8 732.35,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="735.35" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Fetches commit parent, base tree SHA,</text>
<text xml:space="preserve" text-anchor="start" x="735.35" y="-568.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">and creates trees/commits</text>
</g>
<!-- gitrefstorage&#45;&gt;gitremote -->
<g id="edge18" class="edge">
<title>gitrefstorage&#45;&gt;gitremote</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1461.45,-322.01C1461.45,-281 1461.45,-232.29 1461.45,-190.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1464.08,-190.46 1461.45,-182.96 1458.83,-190.46 1464.08,-190.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1461.45,-240 1461.45,-262.8 1690.02,-262.8 1690.02,-240 1461.45,-240"/>
<text xml:space="preserve" text-anchor="start" x="1464.45" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Pushed and fetched from git remote</text>
</g>
<!-- author&#45;&gt;vscodeext -->
<g id="edge1" class="edge">
<title>author&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2952.14,-1350.88C2885.74,-1314.06 2804.5,-1274.58 2726.45,-1251.2 2695.61,-1241.96 2684.71,-1254.2 2654.45,-1243.2 2617.67,-1229.83 2580.96,-1209.32 2548.15,-1187.71"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2549.66,-1185.57 2541.97,-1183.58 2546.74,-1189.93 2549.66,-1185.57"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2822.3,-1251.2 2822.3,-1290.8 3097.52,-1290.8 3097.52,-1251.2 2822.3,-1251.2"/>
<text xml:space="preserve" text-anchor="start" x="2825.3" y="-1273.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Edits markdown and previews comments in</text>
<text xml:space="preserve" text-anchor="start" x="2825.3" y="-1257" font-family="Arial" font-size="14.00" fill="#c9c9c9">VS Code</text>
</g>
<!-- author&#45;&gt;webviewpreview -->
<g id="edge2" class="edge">
<title>author&#45;&gt;webviewpreview</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3124.39,-1350.82C3148.03,-1258.9 3170.56,-1113.53 3118.45,-1002 3090.01,-941.12 3038.81,-889.06 2987.7,-848.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2989.41,-846.56 2981.89,-844.01 2986.18,-850.7 2989.41,-846.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3150.15,-1072.2 3150.15,-1111.8 3364.68,-1111.8 3364.68,-1072.2 3150.15,-1072.2"/>
<text xml:space="preserve" text-anchor="start" x="3153.15" y="-1094.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Interacts with preview drawer and</text>
<text xml:space="preserve" text-anchor="start" x="3153.15" y="-1078" font-family="Arial" font-size="14.00" fill="#c9c9c9">comment threads</text>
</g>
<!-- reviewer&#45;&gt;vscodeext -->
<g id="edge3" class="edge">
<title>reviewer&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1953.27,-1350.94C2007.09,-1314.14 2073.63,-1274.64 2139.43,-1251.2 2166.03,-1241.72 2175.99,-1253.05 2202.45,-1243.2 2238.93,-1229.62 2275.4,-1209.16 2308.07,-1187.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2309.43,-1189.92 2314.22,-1183.58 2306.52,-1185.56 2309.43,-1189.92"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2139.43,-1259.6 2139.43,-1282.4 2401.45,-1282.4 2401.45,-1259.6 2139.43,-1259.6"/>
<text xml:space="preserve" text-anchor="start" x="2142.43" y="-1265.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reviews local documentation in VS Code</text>
</g>
<!-- reviewer&#45;&gt;chromeext -->
<g id="edge4" class="edge">
<title>reviewer&#45;&gt;chromeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1677.45,-1388.02C1573.13,-1352.12 1435.18,-1300.59 1318.45,-1243.2 1284.85,-1226.68 1249.91,-1206.89 1217.33,-1187.18"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1219.01,-1185.13 1211.24,-1183.47 1216.28,-1189.61 1219.01,-1185.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1414.88,-1259.6 1414.88,-1282.4 1661.3,-1282.4 1661.3,-1259.6 1414.88,-1259.6"/>
<text xml:space="preserve" text-anchor="start" x="1417.88" y="-1265.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reviews PR markdown files on GitHub</text>
</g>
<!-- aiagent&#45;&gt;vscodeext -->
<g id="edge5" class="edge">
<title>aiagent&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2428.45,-1350.94C2428.45,-1302.51 2428.45,-1242.43 2428.45,-1192.44"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2431.08,-1192.46 2428.45,-1184.96 2425.83,-1192.46 2431.08,-1192.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2428.45,-1251.2 2428.45,-1290.8 2699.05,-1290.8 2699.05,-1251.2 2428.45,-1251.2"/>
<text xml:space="preserve" text-anchor="start" x="2431.45" y="-1273.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reads and leaves anchored comments via</text>
<text xml:space="preserve" text-anchor="start" x="2431.45" y="-1257" font-family="Arial" font-size="14.00" fill="#c9c9c9">agentic workflows</text>
</g>
</g>
</svg>
`;
      case `containers`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="3395pt" height="1561pt"
 viewBox="0.00 0.00 3395.00 1561.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1545.85)">
<g id="clust1" class="cluster">
<title>cluster_mdcomments</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="846.45,-282.8 846.45,-1243.2 3103.45,-1243.2 3103.45,-282.8 846.45,-282.8"/>
<text xml:space="preserve" text-anchor="start" x="854.45" y="-1230.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">MARKDOWN COMMENTS</text>
</g>
<!-- vscodeext -->
<g id="node1" class="node">
<title>vscodeext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2599.42,-1182 2257.49,-1182 2257.49,-1002 2599.42,-1002 2599.42,-1182"/>
<text xml:space="preserve" text-anchor="start" x="2289.49" y="-1122.8" font-family="Arial" font-size="20.00" fill="#eff6ff">VS Code Extension Subsystem</text>
<text xml:space="preserve" text-anchor="start" x="2325.13" y="-1101.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, VS Code Extension API</text>
<text xml:space="preserve" text-anchor="start" x="2283.38" y="-1080.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Desktop IDE extension hosting early hooks,</text>
<text xml:space="preserve" text-anchor="start" x="2277.54" y="-1062.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">auth resolution, optimistic state management,</text>
<text xml:space="preserve" text-anchor="start" x="2350.9" y="-1044.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">and preview integration</text>
</g>
<!-- chromeext -->
<g id="node2" class="node">
<title>chromeext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1262.91,-1182 885.99,-1182 885.99,-1002 1262.91,-1002 1262.91,-1182"/>
<text xml:space="preserve" text-anchor="start" x="921.61" y="-1122.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Chrome / Edge / Firefox Extension</text>
<text xml:space="preserve" text-anchor="start" x="956.68" y="-1101.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, Manifest V3, WebExtensions</text>
<text xml:space="preserve" text-anchor="start" x="920.22" y="-1080.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Cross&#45;browser Manifest V3 extension injecting</text>
<text xml:space="preserve" text-anchor="start" x="906.05" y="-1062.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">comment threads onto GitHub markdown previews</text>
<text xml:space="preserve" text-anchor="start" x="1032.35" y="-1044.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">and raw files</text>
</g>
<!-- obsidianplugin -->
<g id="node3" class="node">
<title>obsidianplugin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1717.69,-1182 1373.22,-1182 1373.22,-1002 1717.69,-1002 1717.69,-1182"/>
<text xml:space="preserve" text-anchor="start" x="1475.41" y="-1122.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Obsidian Plugin</text>
<text xml:space="preserve" text-anchor="start" x="1472.84" y="-1101.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, Obsidian API</text>
<text xml:space="preserve" text-anchor="start" x="1393.27" y="-1080.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Obsidian Vault plugin supporting reading view</text>
<text xml:space="preserve" text-anchor="start" x="1407.05" y="-1062.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">anchors, live preview gutters, and sidebar</text>
<text xml:space="preserve" text-anchor="start" x="1504.6" y="-1044.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">commenting</text>
</g>
<!-- starlightplugin -->
<g id="node4" class="node">
<title>starlightplugin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2147.47,-1182 1827.43,-1182 1827.43,-1002 2147.47,-1002 2147.47,-1182"/>
<text xml:space="preserve" text-anchor="start" x="1888.52" y="-1122.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Astro / Starlight Plugin</text>
<text xml:space="preserve" text-anchor="start" x="1917.01" y="-1101.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Astro, TypeScript, CSS3</text>
<text xml:space="preserve" text-anchor="start" x="1857.79" y="-1080.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Documentation theme plugin and Astro</text>
<text xml:space="preserve" text-anchor="start" x="1873.22" y="-1062.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">integration providing an interactive</text>
<text xml:space="preserve" text-anchor="start" x="1897.01" y="-1044.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">slide&#45;over comment drawer</text>
</g>
<!-- webviewpreview -->
<g id="node5" class="node">
<title>webviewpreview</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3014.74,-842.4 2656.17,-842.4 2656.17,-662.4 3014.74,-662.4 3014.74,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="2716.53" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Webview Preview Runtime</text>
<text xml:space="preserve" text-anchor="start" x="2738.28" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">HTML5, CSS3, Vanilla JavaScript</text>
<text xml:space="preserve" text-anchor="start" x="2676.22" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">In&#45;situ markdown preview webview environment</text>
<text xml:space="preserve" text-anchor="start" x="2699.97" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">hosting interactive comment cards, inline</text>
<text xml:space="preserve" text-anchor="start" x="2742.48" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">badges, and sidebar drawer</text>
</g>
<!-- telemetryproxy -->
<g id="node6" class="node">
<title>telemetryproxy</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2474.65,-842.4 2140.26,-842.4 2140.26,-662.4 2474.65,-662.4 2474.65,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="2234.66" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Telemetry Proxy</text>
<text xml:space="preserve" text-anchor="start" x="2189.69" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, Cloudflare Workers / Node.js</text>
<text xml:space="preserve" text-anchor="start" x="2160.31" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Zero&#45;secret OpenTelemetry proxy scrubbing</text>
<text xml:space="preserve" text-anchor="start" x="2175.71" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">customer content, file paths, and author</text>
<text xml:space="preserve" text-anchor="start" x="2277.85" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">identities</text>
</g>
<!-- sharedengine -->
<g id="node7" class="node">
<title>sharedengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1621.47,-842.4 1301.43,-842.4 1301.43,-662.4 1621.47,-662.4 1621.47,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="1358.05" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared Domain Engine</text>
<text xml:space="preserve" text-anchor="start" x="1430.39" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="1325.55" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Core domain engine with FNV&#45;1a anchor</text>
<text xml:space="preserve" text-anchor="start" x="1323.47" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">hashing, fuzzy re&#45;anchoring, Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="1353.48" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">backend, and 3&#45;way merge logic</text>
</g>
<!-- safariext -->
<g id="node8" class="node">
<title>safariext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3063.67,-1182 2709.24,-1182 2709.24,-1002 3063.67,-1002 3063.67,-1182"/>
<text xml:space="preserve" text-anchor="start" x="2777.52" y="-1113.8" font-family="Arial" font-size="20.00" fill="#eff6ff">macOS Safari Extension</text>
<text xml:space="preserve" text-anchor="start" x="2800.12" y="-1092.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Swift, WebKit, Manifest V2/V3</text>
<text xml:space="preserve" text-anchor="start" x="2729.29" y="-1071.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Native macOS Safari Web Extension packaged</text>
<text xml:space="preserve" text-anchor="start" x="2794.73" y="-1053.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">with AppKit host application</text>
</g>
<!-- gitrefstorage -->
<g id="node9" class="node">
<title>gitrefstorage</title>
<path fill="#3b82f6" stroke="#2563eb" stroke-width="2" d="M1635.74,-486.44C1635.74,-495.47 1557.62,-502.8 1461.45,-502.8 1365.29,-502.8 1287.17,-495.47 1287.17,-486.44 1287.17,-486.44 1287.17,-339.16 1287.17,-339.16 1287.17,-330.13 1365.29,-322.8 1461.45,-322.8 1557.62,-322.8 1635.74,-330.13 1635.74,-339.16 1635.74,-339.16 1635.74,-486.44 1635.74,-486.44"/>
<path fill="none" stroke="#2563eb" stroke-width="2" d="M1635.74,-486.44C1635.74,-477.41 1557.62,-470.07 1461.45,-470.07 1365.29,-470.07 1287.17,-477.41 1287.17,-486.44"/>
<text xml:space="preserve" text-anchor="start" x="1379.75" y="-443.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Git Ref Data Store</text>
<text xml:space="preserve" text-anchor="start" x="1419.91" y="-422.6" font-family="Arial" font-size="13.00" fill="#bfdbfe">Git Ref, YAML</text>
<text xml:space="preserve" text-anchor="start" x="1329.74" y="-401" font-family="Arial" font-size="15.00" fill="#bfdbfe">Orphan git ref (refs/md&#45;comments/data)</text>
<text xml:space="preserve" text-anchor="start" x="1307.22" y="-383" font-family="Arial" font-size="15.00" fill="#bfdbfe">storing versioned YAML comments completely</text>
<text xml:space="preserve" text-anchor="start" x="1379.74" y="-365" font-family="Arial" font-size="15.00" fill="#bfdbfe">outside source branches</text>
</g>
<!-- author -->
<g id="node10" class="node">
<title>author</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="3256.47,-1530.8 2936.43,-1530.8 2936.43,-1350.8 3256.47,-1350.8 3256.47,-1530.8"/>
<text xml:space="preserve" text-anchor="start" x="3018.64" y="-1452.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Document Author</text>
<text xml:space="preserve" text-anchor="start" x="2968.88" y="-1429.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Software engineer writing, editing, and</text>
<text xml:space="preserve" text-anchor="start" x="2972.64" y="-1411.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">previewing markdown documentation</text>
</g>
<!-- reviewer -->
<g id="node11" class="node">
<title>reviewer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1997.47,-1530.8 1677.43,-1530.8 1677.43,-1350.8 1997.47,-1350.8 1997.47,-1530.8"/>
<text xml:space="preserve" text-anchor="start" x="1736.3" y="-1461.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Pull Request Reviewer</text>
<text xml:space="preserve" text-anchor="start" x="1699.87" y="-1438.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Peer engineer or technical lead reviewing</text>
<text xml:space="preserve" text-anchor="start" x="1701.14" y="-1420.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">markdown documentation in PRs or local</text>
<text xml:space="preserve" text-anchor="start" x="1814.94" y="-1402.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">editors</text>
</g>
<!-- aiagent -->
<g id="node12" class="node">
<title>aiagent</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2603.19,-1530.8 2253.72,-1530.8 2253.72,-1350.8 2603.19,-1350.8 2603.19,-1530.8"/>
<text xml:space="preserve" text-anchor="start" x="2355.63" y="-1461.8" font-family="Arial" font-size="20.00" fill="#eff6ff">AI Coding Agent</text>
<text xml:space="preserve" text-anchor="start" x="2273.78" y="-1438.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Autonomous coding agent (Antigravity, Claude</text>
<text xml:space="preserve" text-anchor="start" x="2282.14" y="-1420.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Code, Cursor) creating and resolving review</text>
<text xml:space="preserve" text-anchor="start" x="2393.86" y="-1402.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">comments</text>
</g>
<!-- githubapi -->
<g id="node13" class="node">
<title>githubapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="326.91,-502.8 0,-502.8 0,-322.8 326.91,-322.8 326.91,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="30.63" y="-433.8" font-family="Arial" font-size="20.00" fill="#eff6ff">GitHub REST &amp; GraphQL API</text>
<text xml:space="preserve" text-anchor="start" x="20.06" y="-410.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">External GitHub API providing Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="22.59" y="-392.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">(trees, commits, refs), OAuth Device Flow,</text>
<text xml:space="preserve" text-anchor="start" x="43" y="-374.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">user profiles, and commit comments</text>
</g>
<!-- otelbackend -->
<g id="node14" class="node">
<title>otelbackend</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="806.19,-502.8 436.72,-502.8 436.72,-322.8 806.19,-322.8 806.19,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="510.84" y="-433.8" font-family="Arial" font-size="20.00" fill="#eff6ff">OpenTelemetry Backend</text>
<text xml:space="preserve" text-anchor="start" x="498.05" y="-410.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">External telemetry ingestion endpoint</text>
<text xml:space="preserve" text-anchor="start" x="456.78" y="-392.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">receiving scrubbed, anonymous performance and</text>
<text xml:space="preserve" text-anchor="start" x="561.43" y="-374.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">diagnostic metrics</text>
</g>
<!-- gitremote -->
<g id="node15" class="node">
<title>gitremote</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1621.47,-180 1301.43,-180 1301.43,0 1621.47,0 1621.47,-180"/>
<text xml:space="preserve" text-anchor="start" x="1360.31" y="-111" font-family="Arial" font-size="20.00" fill="#eff6ff">Git Remote Repository</text>
<text xml:space="preserve" text-anchor="start" x="1331.4" y="-88" font-family="Arial" font-size="15.00" fill="#bfdbfe">Upstream Git repository hosting project</text>
<text xml:space="preserve" text-anchor="start" x="1353.46" y="-70" font-family="Arial" font-size="15.00" fill="#bfdbfe">source branches and the orphan</text>
<text xml:space="preserve" text-anchor="start" x="1357.66" y="-52" font-family="Arial" font-size="15.00" fill="#bfdbfe">refs/md&#45;comments/data branch</text>
</g>
<!-- vscodeext&#45;&gt;webviewpreview -->
<g id="edge6" class="edge">
<title>vscodeext&#45;&gt;webviewpreview</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2535.65,-1002.08C2592.45,-954.97 2662.25,-897.07 2720.21,-848.99"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2721.88,-851.02 2725.98,-844.21 2718.53,-846.98 2721.88,-851.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2644.16,-910.8 2644.16,-933.6 2671.15,-933.6 2671.15,-910.8 2644.16,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="2647.16" y="-919" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- vscodeext&#45;&gt;telemetryproxy -->
<g id="edge7" class="edge">
<title>vscodeext&#45;&gt;telemetryproxy</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2323.28,-1002C2308.02,-983.83 2294.57,-963.6 2285.9,-942 2274.7,-914.09 2274.22,-882.12 2278.25,-852.53"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2280.83,-852.97 2279.39,-845.16 2275.65,-852.17 2280.83,-852.97"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2285.9,-902.4 2285.9,-942 2556.45,-942 2556.45,-902.4 2285.9,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="2288.9" y="-925" font-family="Arial" font-size="14.00" fill="#c9c9c9">Transmits scrubbed, anonymous telemetry</text>
<text xml:space="preserve" text-anchor="start" x="2288.9" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">payloads</text>
</g>
<!-- vscodeext&#45;&gt;sharedengine -->
<g id="edge8" class="edge">
<title>vscodeext&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2257.85,-1003.38C2186.6,-968.95 2102.21,-930.93 2023.45,-902.4 1894.48,-855.69 1744.06,-816.58 1631.31,-790.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1632.06,-787.65 1624.16,-788.5 1630.87,-792.76 1632.06,-787.65"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2114.47,-910.8 2114.47,-933.6 2141.46,-933.6 2141.46,-910.8 2114.47,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="2117.47" y="-919" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- vscodeext&#45;&gt;githubapi -->
<g id="edge9" class="edge">
<title>vscodeext&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2257.8,-1017.22C2239.37,-1011.24 2220.68,-1005.98 2202.45,-1002 1722.78,-897.38 1570.73,-1079.59 1099.45,-942 783.79,-849.84 459.14,-634.24 287.49,-508.83"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="289.22,-506.85 281.62,-504.54 286.12,-511.09 289.22,-506.85"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="826.04,-741 826.04,-763.8 853.03,-763.8 853.03,-741 826.04,-741"/>
<text xml:space="preserve" text-anchor="start" x="829.04" y="-749.2" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- chromeext&#45;&gt;sharedengine -->
<g id="edge10" class="edge">
<title>chromeext&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1096.58,-1002.2C1108.68,-967.79 1126.71,-930.1 1152.9,-902.4 1191.02,-862.1 1242.3,-831.39 1292.1,-808.63"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1293.17,-811.03 1298.94,-805.57 1291.02,-806.24 1293.17,-811.03"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1152.9,-902.4 1152.9,-942 1367.45,-942 1367.45,-902.4 1152.9,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="1155.9" y="-925" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and YAML</text>
<text xml:space="preserve" text-anchor="start" x="1155.9" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">serialization</text>
</g>
<!-- chromeext&#45;&gt;githubapi -->
<g id="edge11" class="edge">
<title>chromeext&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M886.16,-1062.9C657.37,-1024.56 291.38,-948.33 207.03,-842.4 133.2,-749.67 134.08,-607.5 145.46,-512.64"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="148.03,-513.24 146.37,-505.47 142.83,-512.58 148.03,-513.24"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="207.03,-732.6 207.03,-772.2 446.45,-772.2 446.45,-732.6 207.03,-732.6"/>
<text xml:space="preserve" text-anchor="start" x="210.03" y="-755.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Interacts with GitHub Git Data API via</text>
<text xml:space="preserve" text-anchor="start" x="210.03" y="-738.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Device Flow</text>
</g>
<!-- obsidianplugin&#45;&gt;sharedengine -->
<g id="edge12" class="edge">
<title>obsidianplugin&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1439.37,-1002.12C1423.98,-983.94 1410.4,-963.67 1401.65,-942 1390.03,-913.24 1394.05,-881.31 1404.12,-852.02"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1406.56,-852.98 1406.7,-845.03 1401.64,-851.15 1406.56,-852.98"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1401.65,-910.8 1401.65,-933.6 1657.45,-933.6 1657.45,-910.8 1401.65,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="1404.65" y="-916.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and local storage</text>
</g>
<!-- starlightplugin&#45;&gt;sharedengine -->
<g id="edge13" class="edge">
<title>starlightplugin&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1848.91,-1002.08C1774.91,-954.58 1683.82,-896.12 1608.55,-847.81"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1610.2,-845.75 1602.47,-843.91 1607.37,-850.17 1610.2,-845.75"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1740.22,-910.8 1740.22,-933.6 1996.02,-933.6 1996.02,-910.8 1740.22,-910.8"/>
<text xml:space="preserve" text-anchor="start" x="1743.22" y="-916.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and client drawer</text>
</g>
<!-- webviewpreview&#45;&gt;vscodeext -->
<g id="edge14" class="edge">
<title>webviewpreview&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2782.91,-842.05C2759.9,-876.04 2730.76,-913.47 2698.45,-942 2671.4,-965.89 2639.87,-987.53 2608.1,-1006.45"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2606.89,-1004.12 2601.75,-1010.18 2609.55,-1008.65 2606.89,-1004.12"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2734.15,-902.4 2734.15,-942 2961.93,-942 2961.93,-902.4 2734.15,-902.4"/>
<text xml:space="preserve" text-anchor="start" x="2737.15" y="-925" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispatches actions (add, reply, edit,</text>
<text xml:space="preserve" text-anchor="start" x="2737.15" y="-908.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">delete, react) via postMessage</text>
</g>
<!-- telemetryproxy&#45;&gt;otelbackend -->
<g id="edge15" class="edge">
<title>telemetryproxy&#45;&gt;otelbackend</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2140.47,-727.26C2013.32,-709.02 1833.93,-683.6 1676.45,-662.4 1292.48,-610.72 1185.15,-630.77 819.45,-502.8 818.2,-502.36 816.95,-501.92 815.69,-501.47"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="816.81,-499.08 808.86,-498.99 815.01,-504.02 816.81,-499.08"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1183.14,-571.2 1183.14,-594 1409.34,-594 1409.34,-571.2 1183.14,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1186.14" y="-577" font-family="Arial" font-size="14.00" fill="#c9c9c9">Forwards sanitized telemetry spans</text>
</g>
<!-- sharedengine&#45;&gt;gitrefstorage -->
<g id="edge16" class="edge">
<title>sharedengine&#45;&gt;gitrefstorage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1461.45,-662.7C1461.45,-617.02 1461.45,-561.14 1461.45,-513.92"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1464.08,-514.19 1461.45,-506.69 1458.83,-514.2 1464.08,-514.19"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1461.45,-571.2 1461.45,-594 1726.56,-594 1726.56,-571.2 1461.45,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="1464.45" y="-577" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reads and writes refs/md&#45;comments/data</text>
</g>
<!-- sharedengine&#45;&gt;githubapi -->
<g id="edge17" class="edge">
<title>sharedengine&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1301.56,-728.42C1152.22,-704.69 924.18,-662.63 732.35,-602.4 689.92,-589.08 682.71,-576.67 640.45,-562.8 528.19,-525.94 494.07,-538.58 381.45,-502.8 366.61,-498.08 351.36,-492.8 336.15,-487.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="337.47,-484.92 329.53,-484.77 335.65,-489.84 337.47,-484.92"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="732.35,-562.8 732.35,-602.4 983.45,-602.4 983.45,-562.8 732.35,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="735.35" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Fetches commit parent, base tree SHA,</text>
<text xml:space="preserve" text-anchor="start" x="735.35" y="-568.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">and creates trees/commits</text>
</g>
<!-- gitrefstorage&#45;&gt;gitremote -->
<g id="edge18" class="edge">
<title>gitrefstorage&#45;&gt;gitremote</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1461.45,-322.01C1461.45,-281 1461.45,-232.29 1461.45,-190.2"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1464.08,-190.46 1461.45,-182.96 1458.83,-190.46 1464.08,-190.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1461.45,-240 1461.45,-262.8 1690.02,-262.8 1690.02,-240 1461.45,-240"/>
<text xml:space="preserve" text-anchor="start" x="1464.45" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Pushed and fetched from git remote</text>
</g>
<!-- author&#45;&gt;vscodeext -->
<g id="edge1" class="edge">
<title>author&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2952.14,-1350.88C2885.74,-1314.06 2804.5,-1274.58 2726.45,-1251.2 2695.61,-1241.96 2684.71,-1254.2 2654.45,-1243.2 2617.67,-1229.83 2580.96,-1209.32 2548.15,-1187.71"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2549.66,-1185.57 2541.97,-1183.58 2546.74,-1189.93 2549.66,-1185.57"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2822.3,-1251.2 2822.3,-1290.8 3097.52,-1290.8 3097.52,-1251.2 2822.3,-1251.2"/>
<text xml:space="preserve" text-anchor="start" x="2825.3" y="-1273.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Edits markdown and previews comments in</text>
<text xml:space="preserve" text-anchor="start" x="2825.3" y="-1257" font-family="Arial" font-size="14.00" fill="#c9c9c9">VS Code</text>
</g>
<!-- author&#45;&gt;webviewpreview -->
<g id="edge2" class="edge">
<title>author&#45;&gt;webviewpreview</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M3124.39,-1350.82C3148.03,-1258.9 3170.56,-1113.53 3118.45,-1002 3090.01,-941.12 3038.81,-889.06 2987.7,-848.55"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2989.41,-846.56 2981.89,-844.01 2986.18,-850.7 2989.41,-846.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="3150.15,-1072.2 3150.15,-1111.8 3364.68,-1111.8 3364.68,-1072.2 3150.15,-1072.2"/>
<text xml:space="preserve" text-anchor="start" x="3153.15" y="-1094.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Interacts with preview drawer and</text>
<text xml:space="preserve" text-anchor="start" x="3153.15" y="-1078" font-family="Arial" font-size="14.00" fill="#c9c9c9">comment threads</text>
</g>
<!-- reviewer&#45;&gt;vscodeext -->
<g id="edge3" class="edge">
<title>reviewer&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1953.27,-1350.94C2007.09,-1314.14 2073.63,-1274.64 2139.43,-1251.2 2166.03,-1241.72 2175.99,-1253.05 2202.45,-1243.2 2238.93,-1229.62 2275.4,-1209.16 2308.07,-1187.68"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2309.43,-1189.92 2314.22,-1183.58 2306.52,-1185.56 2309.43,-1189.92"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2139.43,-1259.6 2139.43,-1282.4 2401.45,-1282.4 2401.45,-1259.6 2139.43,-1259.6"/>
<text xml:space="preserve" text-anchor="start" x="2142.43" y="-1265.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reviews local documentation in VS Code</text>
</g>
<!-- reviewer&#45;&gt;chromeext -->
<g id="edge4" class="edge">
<title>reviewer&#45;&gt;chromeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1677.45,-1388.02C1573.13,-1352.12 1435.18,-1300.59 1318.45,-1243.2 1284.85,-1226.68 1249.91,-1206.89 1217.33,-1187.18"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1219.01,-1185.13 1211.24,-1183.47 1216.28,-1189.61 1219.01,-1185.13"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1414.88,-1259.6 1414.88,-1282.4 1661.3,-1282.4 1661.3,-1259.6 1414.88,-1259.6"/>
<text xml:space="preserve" text-anchor="start" x="1417.88" y="-1265.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reviews PR markdown files on GitHub</text>
</g>
<!-- aiagent&#45;&gt;vscodeext -->
<g id="edge5" class="edge">
<title>aiagent&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2428.45,-1350.94C2428.45,-1302.51 2428.45,-1242.43 2428.45,-1192.44"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2431.08,-1192.46 2428.45,-1184.96 2425.83,-1192.46 2431.08,-1192.46"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2428.45,-1251.2 2428.45,-1290.8 2699.05,-1290.8 2699.05,-1251.2 2428.45,-1251.2"/>
<text xml:space="preserve" text-anchor="start" x="2431.45" y="-1273.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reads and leaves anchored comments via</text>
<text xml:space="preserve" text-anchor="start" x="2431.45" y="-1257" font-family="Arial" font-size="14.00" fill="#c9c9c9">agentic workflows</text>
</g>
</g>
</svg>
`;
      case `vscodeInternals`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="2830pt" height="963pt"
 viewBox="0.00 0.00 2830.00 963.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 947.85)">
<g id="clust1" class="cluster">
<title>cluster_vscodeext</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="519.95,-282.8 519.95,-924.8 2791.95,-924.8 2791.95,-282.8 519.95,-282.8"/>
<text xml:space="preserve" text-anchor="start" x="527.95" y="-911.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">VS CODE EXTENSION SUBSYSTEM</text>
</g>
<!-- commentpreviewpanel -->
<g id="node1" class="node">
<title>commentpreviewpanel</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1349.4,-842.4 992.49,-842.4 992.49,-662.4 1349.4,-662.4 1349.4,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="1060.9" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Comment Preview Panel</text>
<text xml:space="preserve" text-anchor="start" x="1139.88" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="1012.55" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Native markdown preview coordinator, webview</text>
<text xml:space="preserve" text-anchor="start" x="1038.81" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">communicator, and custom URI handler</text>
<text xml:space="preserve" text-anchor="start" x="1129.69" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">(vscode://...)</text>
</g>
<!-- markdownitplugin -->
<g id="node2" class="node">
<title>markdownitplugin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1798.67,-842.4 1459.23,-842.4 1459.23,-662.4 1798.67,-662.4 1798.67,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="1543.36" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Markdown&#45;It Plugin</text>
<text xml:space="preserve" text-anchor="start" x="1558.87" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, markdown&#45;it</text>
<text xml:space="preserve" text-anchor="start" x="1479.28" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Markdown&#45;It parser plugin injecting anchored</text>
<text xml:space="preserve" text-anchor="start" x="1479.7" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">comment badges, script bridges, and floating</text>
<text xml:space="preserve" text-anchor="start" x="1479.29" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">FAB drawer widgets into the preview pipeline</text>
</g>
<!-- commentactions -->
<g id="node3" class="node">
<title>commentactions</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2239.08,-842.4 1908.81,-842.4 1908.81,-662.4 2239.08,-662.4 2239.08,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="1962.23" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Comment Action Handler</text>
<text xml:space="preserve" text-anchor="start" x="2042.88" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="1928.87" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Action dispatch handler executing comment</text>
<text xml:space="preserve" text-anchor="start" x="1946.37" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">additions, replies, edits, reactions, and</text>
<text xml:space="preserve" text-anchor="start" x="1961.8" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">deletions without disruptive toasts</text>
</g>
<!-- authmanager -->
<g id="node4" class="node">
<title>authmanager</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2690.5,-842.4 2349.4,-842.4 2349.4,-662.4 2690.5,-662.4 2690.5,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="2414.32" y="-792.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Authentication Manager</text>
<text xml:space="preserve" text-anchor="start" x="2488.88" y="-771.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="2401.78" y="-749.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Multi&#45;tier token resolver (Session &#45;&gt;</text>
<text xml:space="preserve" text-anchor="start" x="2369.45" y="-731.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">context.secrets &#45;&gt; globalState &#45;&gt; process.env</text>
<text xml:space="preserve" text-anchor="start" x="2382.82" y="-713.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">&#45;&gt; gh CLI &#45;&gt; RFC 8628 Device Flow) with</text>
<text xml:space="preserve" text-anchor="start" x="2395.7" y="-695.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">onDidChangeAuthState event emitter</text>
</g>
<!-- commentstore -->
<g id="node5" class="node">
<title>commentstore</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="882.33,-842.4 559.57,-842.4 559.57,-662.4 882.33,-662.4 882.33,-842.4"/>
<text xml:space="preserve" text-anchor="start" x="650.92" y="-783.2" font-family="Arial" font-size="20.00" fill="#eff6ff">Comment Store</text>
<text xml:space="preserve" text-anchor="start" x="689.88" y="-762.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="589.23" y="-740.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Workspace&#45;level comment lifecycle and</text>
<text xml:space="preserve" text-anchor="start" x="579.62" y="-722.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">persistence coordinator syncing local state</text>
<text xml:space="preserve" text-anchor="start" x="626.75" y="-704.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">with refs/md&#45;comments/data</text>
</g>
<!-- optimisticstore -->
<g id="node6" class="node">
<title>optimisticstore</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2239.89,-502.8 1908,-502.8 1908,-322.8 2239.89,-322.8 2239.89,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="1962.24" y="-443.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Optimistic Mutation Store</text>
<text xml:space="preserve" text-anchor="start" x="2042.88" y="-422.6" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="1928.06" y="-401" font-family="Arial" font-size="15.00" fill="#bfdbfe">In&#45;memory mutation store providing resilient</text>
<text xml:space="preserve" text-anchor="start" x="1951.36" y="-383" font-family="Arial" font-size="15.00" fill="#bfdbfe">sequential deletions, inline edits, and</text>
<text xml:space="preserve" text-anchor="start" x="1996.82" y="-365" font-family="Arial" font-size="15.00" fill="#bfdbfe">instant toggle reactions</text>
</g>
<!-- authorresolver -->
<g id="node7" class="node">
<title>authorresolver</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="2689.66,-502.8 2350.24,-502.8 2350.24,-322.8 2689.66,-322.8 2689.66,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="2448.25" y="-452.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Author Resolver</text>
<text xml:space="preserve" text-anchor="start" x="2488.88" y="-431.6" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="2431.16" y="-410" font-family="Arial" font-size="15.00" fill="#bfdbfe">Git config identity extractor</text>
<text xml:space="preserve" text-anchor="start" x="2386.14" y="-392" font-family="Arial" font-size="15.00" fill="#bfdbfe">(user.name/user.email) and GitHub user</text>
<text xml:space="preserve" text-anchor="start" x="2370.29" y="-374" font-family="Arial" font-size="15.00" fill="#bfdbfe">profile resolver with LRU caching and display</text>
<text xml:space="preserve" text-anchor="start" x="2465.75" y="-356" font-family="Arial" font-size="15.00" fill="#bfdbfe">name formatting</text>
</g>
<!-- webviewpreview -->
<g id="node8" class="node">
<title>webviewpreview</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="480.24,-502.8 121.66,-502.8 121.66,-322.8 480.24,-322.8 480.24,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="182.02" y="-443.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Webview Preview Runtime</text>
<text xml:space="preserve" text-anchor="start" x="203.77" y="-422.6" font-family="Arial" font-size="13.00" fill="#bfdbfe">HTML5, CSS3, Vanilla JavaScript</text>
<text xml:space="preserve" text-anchor="start" x="141.71" y="-401" font-family="Arial" font-size="15.00" fill="#bfdbfe">In&#45;situ markdown preview webview environment</text>
<text xml:space="preserve" text-anchor="start" x="165.47" y="-383" font-family="Arial" font-size="15.00" fill="#bfdbfe">hosting interactive comment cards, inline</text>
<text xml:space="preserve" text-anchor="start" x="207.97" y="-365" font-family="Arial" font-size="15.00" fill="#bfdbfe">badges, and sidebar drawer</text>
</g>
<!-- githubapi -->
<g id="node9" class="node">
<title>githubapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1687.4,-180 1360.49,-180 1360.49,0 1687.4,0 1687.4,-180"/>
<text xml:space="preserve" text-anchor="start" x="1391.12" y="-111" font-family="Arial" font-size="20.00" fill="#eff6ff">GitHub REST &amp; GraphQL API</text>
<text xml:space="preserve" text-anchor="start" x="1380.55" y="-88" font-family="Arial" font-size="15.00" fill="#bfdbfe">External GitHub API providing Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="1383.08" y="-70" font-family="Arial" font-size="15.00" fill="#bfdbfe">(trees, commits, refs), OAuth Device Flow,</text>
<text xml:space="preserve" text-anchor="start" x="1403.49" y="-52" font-family="Arial" font-size="15.00" fill="#bfdbfe">user profiles, and commit comments</text>
</g>
<!-- sharedengine -->
<g id="node10" class="node">
<title>sharedengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="999.97,-180 679.93,-180 679.93,0 999.97,0 999.97,-180"/>
<text xml:space="preserve" text-anchor="start" x="736.55" y="-120.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared Domain Engine</text>
<text xml:space="preserve" text-anchor="start" x="808.88" y="-99.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="704.04" y="-78.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Core domain engine with FNV&#45;1a anchor</text>
<text xml:space="preserve" text-anchor="start" x="701.96" y="-60.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">hashing, fuzzy re&#45;anchoring, Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="731.97" y="-42.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">backend, and 3&#45;way merge logic</text>
</g>
<!-- commentpreviewpanel&#45;&gt;webviewpreview -->
<g id="edge1" class="edge">
<title>commentpreviewpanel&#45;&gt;webviewpreview</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M992.71,-677.8C974.09,-671.87 955.28,-666.57 936.95,-662.4 859.19,-644.72 275.8,-661.09 221.83,-602.4 198.32,-576.84 204.33,-543.28 220.72,-511.57"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="222.84,-513.17 224.15,-505.33 218.23,-510.64 222.84,-513.17"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="221.83,-562.8 221.83,-602.4 486.95,-602.4 486.95,-562.8 221.83,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="224.83" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Hosts webview and sends initial comment</text>
<text xml:space="preserve" text-anchor="start" x="224.83" y="-568.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">payload</text>
</g>
<!-- markdownitplugin&#45;&gt;webviewpreview -->
<g id="edge2" class="edge">
<title>markdownitplugin&#45;&gt;webviewpreview</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1459.29,-678.1C1440.85,-672 1422.17,-666.58 1403.95,-662.4 1055.38,-582.38 941.27,-714.05 601.52,-602.4 538.04,-581.54 474.4,-544.5 422.12,-508.74"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="423.65,-506.6 415.99,-504.5 420.67,-510.92 423.65,-506.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="601.52,-562.8 601.52,-602.4 840.95,-602.4 840.95,-562.8 601.52,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="604.52" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Injects earlyHook.js, preview.css, and</text>
<text xml:space="preserve" text-anchor="start" x="604.52" y="-568.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">preview DOM elements</text>
</g>
<!-- commentactions&#45;&gt;optimisticstore -->
<g id="edge4" class="edge">
<title>commentactions&#45;&gt;optimisticstore</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2073.95,-662.7C2073.95,-616.74 2073.95,-560.47 2073.95,-513.07"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2076.57,-513.31 2073.95,-505.81 2071.32,-513.31 2076.57,-513.31"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2073.95,-562.8 2073.95,-602.4 2286.15,-602.4 2286.15,-562.8 2073.95,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="2076.95" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Stages mutations optimistically in</text>
<text xml:space="preserve" text-anchor="start" x="2076.95" y="-568.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">memory</text>
</g>
<!-- authmanager&#45;&gt;authorresolver -->
<g id="edge5" class="edge">
<title>authmanager&#45;&gt;authorresolver</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2519.95,-662.7C2519.95,-616.74 2519.95,-560.47 2519.95,-513.07"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="2522.57,-513.31 2519.95,-505.81 2517.32,-513.31 2522.57,-513.31"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2519.95,-571.2 2519.95,-594 2752.41,-594 2752.41,-571.2 2519.95,-571.2"/>
<text xml:space="preserve" text-anchor="start" x="2522.95" y="-577" font-family="Arial" font-size="14.00" fill="#c9c9c9">Provides authenticated GitHub client</text>
</g>
<!-- authmanager&#45;&gt;githubapi -->
<g id="edge6" class="edge">
<title>authmanager&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2349.42,-681.02C2330.84,-674.32 2312.09,-667.96 2293.95,-662.4 1982.79,-567.02 1799.3,-742.62 1579.29,-502.8 1502.56,-419.16 1499.25,-282.76 1508.09,-190.06"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1510.67,-190.56 1508.82,-182.83 1505.45,-190.03 1510.67,-190.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1579.29,-393 1579.29,-432.6 1852.95,-432.6 1852.95,-393 1579.29,-393"/>
<text xml:space="preserve" text-anchor="start" x="1582.29" y="-415.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Authenticates via OAuth Device Flow (RFC</text>
<text xml:space="preserve" text-anchor="start" x="1582.29" y="-398.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">8628)</text>
</g>
<!-- commentstore&#45;&gt;sharedengine -->
<g id="edge7" class="edge">
<title>commentstore&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M559.72,-722.69C449.04,-699.28 300.72,-660.48 178.95,-602.4 110.35,-569.68 74.68,-570.4 39.95,-502.8 -4.72,-415.83 -20.59,-359.58 39.95,-282.8 116.91,-185.22 458.92,-131.67 670.06,-107.39"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="670.17,-110.02 677.32,-106.56 669.57,-104.8 670.17,-110.02"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="39.95,-401.4 39.95,-424.2 66.95,-424.2 66.95,-401.4 39.95,-401.4"/>
<text xml:space="preserve" text-anchor="start" x="42.95" y="-409.6" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- optimisticstore&#45;&gt;webviewpreview -->
<g id="edge8" class="edge">
<title>optimisticstore&#45;&gt;webviewpreview</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1908.21,-476.21C1880.61,-485.76 1852.12,-495 1824.95,-502.8 1666.73,-548.2 1626.57,-563.34 1462.89,-580.77 1247.87,-603.66 701.16,-561.15 492.95,-502.8 492.02,-502.54 491.08,-502.27 490.15,-502.01"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="490.96,-499.51 483.03,-499.85 489.45,-504.53 490.96,-499.51"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1211,-562.8 1211,-602.4 1462.89,-602.4 1462.89,-562.8 1211,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="1214" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Pushes state diff to patch preview DOM</text>
<text xml:space="preserve" text-anchor="start" x="1214" y="-568.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">in&#45;place</text>
</g>
<!-- authorresolver&#45;&gt;githubapi -->
<g id="edge9" class="edge">
<title>authorresolver&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M2378.58,-322.92C2351.48,-308.14 2322.83,-294.01 2294.95,-282.8 2096.73,-203.12 1856.14,-149.65 1697.01,-119.84"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1697.95,-117.35 1690.1,-118.55 1696.99,-122.51 1697.95,-117.35"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="2234.84,-240 2234.84,-262.8 2455.62,-262.8 2455.62,-240 2234.84,-240"/>
<text xml:space="preserve" text-anchor="start" x="2237.84" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Resolves user profiles and avatars</text>
</g>
<!-- webviewpreview&#45;&gt;commentactions -->
<g id="edge3" class="edge">
<title>webviewpreview&#45;&gt;commentactions</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M480.23,-498.71C484.49,-500.14 488.73,-501.51 492.95,-502.8 652.66,-551.71 703.56,-516.16 863.95,-562.8 906.78,-575.25 912.8,-591.96 956.17,-602.4 1344.97,-695.97 1464.18,-572.95 1853.95,-662.4 1868.85,-665.82 1884.06,-670.12 1899.17,-674.97"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1898.26,-677.44 1906.21,-677.29 1899.91,-672.45 1898.26,-677.44"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="956.17,-562.8 956.17,-602.4 1183.95,-602.4 1183.95,-562.8 956.17,-562.8"/>
<text xml:space="preserve" text-anchor="start" x="959.17" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispatches actions (add, reply, edit,</text>
<text xml:space="preserve" text-anchor="start" x="959.17" y="-568.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">delete, react) via postMessage</text>
</g>
<!-- sharedengine&#45;&gt;githubapi -->
<g id="edge10" class="edge">
<title>sharedengine&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M999.88,-90C1104.97,-90 1242.42,-90 1350.19,-90"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1350,-92.63 1357.5,-90 1350,-87.38 1350,-92.63"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1054.68,-93 1054.68,-132.6 1305.78,-132.6 1305.78,-93 1054.68,-93"/>
<text xml:space="preserve" text-anchor="start" x="1057.68" y="-115.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Fetches commit parent, base tree SHA,</text>
<text xml:space="preserve" text-anchor="start" x="1057.68" y="-98.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">and creates trees/commits</text>
</g>
</g>
</svg>
`;
      case `previewInternals`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1824pt" height="908pt"
 viewBox="0.00 0.00 1824.00 908.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 892.85)">
<g id="clust1" class="cluster">
<title>cluster_webviewpreview</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="8,-8 8,-590.2 1786,-590.2 1786,-8 8,-8"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-577.3" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">WEBVIEW PREVIEW RUNTIME</text>
</g>
<!-- confirmationmodal -->
<g id="node1" class="node">
<title>confirmationmodal</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="379.95,-529 48.05,-529 48.05,-349 379.95,-349 379.95,-529"/>
<text xml:space="preserve" text-anchor="start" x="72.28" y="-478.8" font-family="Arial" font-size="20.00" fill="#eff6ff">In&#45;Webview Confirmation Modal</text>
<text xml:space="preserve" text-anchor="start" x="162.34" y="-457.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Vanilla JavaScript</text>
<text xml:space="preserve" text-anchor="start" x="111.04" y="-436.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">In&#45;webview confirmation modal</text>
<text xml:space="preserve" text-anchor="start" x="68.11" y="-418.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">(showConfirmationModal) providing resilient</text>
<text xml:space="preserve" text-anchor="start" x="74.75" y="-400.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">deletion approval without disruptive native</text>
<text xml:space="preserve" text-anchor="start" x="175.64" y="-382.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">input boxes</text>
</g>
<!-- mutationguard -->
<g id="node2" class="node">
<title>mutationguard</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="825.62,-529 490.38,-529 490.38,-349 825.62,-349 825.62,-529"/>
<text xml:space="preserve" text-anchor="start" x="547.95" y="-469.8" font-family="Arial" font-size="20.00" fill="#eff6ff">MutationObserver Guard</text>
<text xml:space="preserve" text-anchor="start" x="606.34" y="-448.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Vanilla JavaScript</text>
<text xml:space="preserve" text-anchor="start" x="510.44" y="-427.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Debounced MutationObserver with strict text</text>
<text xml:space="preserve" text-anchor="start" x="525.82" y="-409.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">content equality checks guarding badge</text>
<text xml:space="preserve" text-anchor="start" x="511.26" y="-391.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">counters against recursive 100% CPU loops</text>
</g>
<!-- earlyhook -->
<g id="node3" class="node">
<title>earlyhook</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1290.22,-529 935.78,-529 935.78,-349 1290.22,-349 1290.22,-529"/>
<text xml:space="preserve" text-anchor="start" x="1018.51" y="-478.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Early Bootstrap Hook</text>
<text xml:space="preserve" text-anchor="start" x="1061.34" y="-457.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Vanilla JavaScript</text>
<text xml:space="preserve" text-anchor="start" x="955.84" y="-436.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Synchronous pre&#45;bootstrap hook (earlyHook.js)</text>
<text xml:space="preserve" text-anchor="start" x="982.93" y="-418.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">caching acquireVsCodeApi(), polyfilling</text>
<text xml:space="preserve" text-anchor="start" x="965.4" y="-400.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">poster, and queueing action dispatches prior</text>
<text xml:space="preserve" text-anchor="start" x="1045.87" y="-382.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">to module execution</text>
</g>
<!-- inplacedomupdater -->
<g id="node4" class="node">
<title>inplacedomupdater</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1746.06,-529 1399.94,-529 1399.94,-349 1746.06,-349 1746.06,-529"/>
<text xml:space="preserve" text-anchor="start" x="1472.97" y="-469.8" font-family="Arial" font-size="20.00" fill="#eff6ff">In&#45;Place DOM Patcher</text>
<text xml:space="preserve" text-anchor="start" x="1521.34" y="-448.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Vanilla JavaScript</text>
<text xml:space="preserve" text-anchor="start" x="1428.37" y="-427.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">In&#45;place DOM patcher (preview&#45;webview.js,</text>
<text xml:space="preserve" text-anchor="start" x="1422.09" y="-409.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">preview.js) updating comment cards, badges,</text>
<text xml:space="preserve" text-anchor="start" x="1420" y="-391.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">and threads without reloading document DOM</text>
</g>
<!-- inlineanchors -->
<g id="node5" class="node">
<title>inlineanchors</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="396.29,-228 47.71,-228 47.71,-48 396.29,-48 396.29,-228"/>
<text xml:space="preserve" text-anchor="start" x="126.96" y="-159.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Inline Anchors &amp; FAB</text>
<text xml:space="preserve" text-anchor="start" x="149.74" y="-138.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Vanilla JavaScript, CSS3</text>
<text xml:space="preserve" text-anchor="start" x="88.59" y="-117.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Document text anchor highlighter, gutter</text>
<text xml:space="preserve" text-anchor="start" x="67.76" y="-99.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">indicators, and floating MD FAB drawer widget</text>
</g>
<!-- vscodeext -->
<g id="node6" class="node">
<title>vscodeext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1355.97,-877.8 1014.03,-877.8 1014.03,-697.8 1355.97,-697.8 1355.97,-877.8"/>
<text xml:space="preserve" text-anchor="start" x="1046.04" y="-818.6" font-family="Arial" font-size="20.00" fill="#eff6ff">VS Code Extension Subsystem</text>
<text xml:space="preserve" text-anchor="start" x="1081.67" y="-797.6" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, VS Code Extension API</text>
<text xml:space="preserve" text-anchor="start" x="1039.92" y="-776" font-family="Arial" font-size="15.00" fill="#bfdbfe">Desktop IDE extension hosting early hooks,</text>
<text xml:space="preserve" text-anchor="start" x="1034.09" y="-758" font-family="Arial" font-size="15.00" fill="#bfdbfe">auth resolution, optimistic state management,</text>
<text xml:space="preserve" text-anchor="start" x="1107.45" y="-740" font-family="Arial" font-size="15.00" fill="#bfdbfe">and preview integration</text>
</g>
<!-- confirmationmodal&#45;&gt;inlineanchors -->
<!-- earlyhook&#45;&gt;vscodeext -->
<g id="edge2" class="edge">
<title>earlyhook&#45;&gt;vscodeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M967.23,-528.83C921.09,-558.43 880.35,-586.78 874.22,-598.2 865.89,-613.71 864.85,-622.91 874.22,-637.8 904.08,-685.23 953.7,-717.9 1004.61,-740.26"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1003.42,-742.6 1011.35,-743.13 1005.48,-737.78 1003.42,-742.6"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="874.22,-598.2 874.22,-637.8 1102,-637.8 1102,-598.2 874.22,-598.2"/>
<text xml:space="preserve" text-anchor="start" x="877.22" y="-620.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Dispatches actions (add, reply, edit,</text>
<text xml:space="preserve" text-anchor="start" x="877.22" y="-604" font-family="Arial" font-size="14.00" fill="#c9c9c9">delete, react) via postMessage</text>
</g>
<!-- vscodeext&#45;&gt;earlyhook -->
<g id="edge3" class="edge">
<title>vscodeext&#45;&gt;earlyhook</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1166.55,-697.94C1160.35,-668.07 1153.23,-633.77 1146.25,-600.13"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1148.89,-599.97 1144.8,-593.16 1143.75,-601.04 1148.89,-599.97"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1128.33,-643.84 1128.33,-666.64 1155.32,-666.64 1155.32,-643.84 1128.33,-643.84"/>
<text xml:space="preserve" text-anchor="start" x="1131.33" y="-652.04" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
<!-- vscodeext&#45;&gt;inplacedomupdater -->
<g id="edge4" class="edge">
<title>vscodeext&#45;&gt;inplacedomupdater</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M1284.42,-697.94C1339.96,-648.29 1409.21,-586.4 1465.94,-535.69"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1467.41,-537.9 1471.25,-530.95 1463.91,-533.99 1467.41,-537.9"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1390.63,-598.2 1390.63,-637.8 1642.52,-637.8 1642.52,-598.2 1390.63,-598.2"/>
<text xml:space="preserve" text-anchor="start" x="1393.63" y="-620.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Pushes state diff to patch preview DOM</text>
<text xml:space="preserve" text-anchor="start" x="1393.63" y="-604" font-family="Arial" font-size="14.00" fill="#c9c9c9">in&#45;place</text>
</g>
</g>
</svg>
`;
      case `browserInternals`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="807pt" height="1212pt"
 viewBox="0.00 0.00 807.00 1212.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 1197.05)">
<!-- reviewer -->
<g id="node1" class="node">
<title>reviewer</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="348.48,-1182 28.44,-1182 28.44,-1002 348.48,-1002 348.48,-1182"/>
<text xml:space="preserve" text-anchor="start" x="87.3" y="-1113" font-family="Arial" font-size="20.00" fill="#eff6ff">Pull Request Reviewer</text>
<text xml:space="preserve" text-anchor="start" x="50.88" y="-1090" font-family="Arial" font-size="15.00" fill="#bfdbfe">Peer engineer or technical lead reviewing</text>
<text xml:space="preserve" text-anchor="start" x="52.15" y="-1072" font-family="Arial" font-size="15.00" fill="#bfdbfe">markdown documentation in PRs or local</text>
<text xml:space="preserve" text-anchor="start" x="165.95" y="-1054" font-family="Arial" font-size="15.00" fill="#bfdbfe">editors</text>
</g>
<!-- chromeext -->
<g id="node2" class="node">
<title>chromeext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="376.92,-859.2 0,-859.2 0,-679.2 376.92,-679.2 376.92,-859.2"/>
<text xml:space="preserve" text-anchor="start" x="35.62" y="-800" font-family="Arial" font-size="20.00" fill="#eff6ff">Chrome / Edge / Firefox Extension</text>
<text xml:space="preserve" text-anchor="start" x="70.69" y="-779" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, Manifest V3, WebExtensions</text>
<text xml:space="preserve" text-anchor="start" x="34.23" y="-757.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">Cross&#45;browser Manifest V3 extension injecting</text>
<text xml:space="preserve" text-anchor="start" x="20.06" y="-739.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">comment threads onto GitHub markdown previews</text>
<text xml:space="preserve" text-anchor="start" x="146.36" y="-721.4" font-family="Arial" font-size="15.00" fill="#bfdbfe">and raw files</text>
</g>
<!-- sharedengine -->
<g id="node3" class="node">
<title>sharedengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="348.48,-519.6 28.44,-519.6 28.44,-339.6 348.48,-339.6 348.48,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="85.06" y="-460.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared Domain Engine</text>
<text xml:space="preserve" text-anchor="start" x="157.4" y="-439.4" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="52.56" y="-417.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Core domain engine with FNV&#45;1a anchor</text>
<text xml:space="preserve" text-anchor="start" x="50.48" y="-399.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">hashing, fuzzy re&#45;anchoring, Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="80.48" y="-381.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">backend, and 3&#45;way merge logic</text>
</g>
<!-- githubapi -->
<g id="node4" class="node">
<title>githubapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="541.91,-180 215.01,-180 215.01,0 541.91,0 541.91,-180"/>
<text xml:space="preserve" text-anchor="start" x="245.63" y="-111" font-family="Arial" font-size="20.00" fill="#eff6ff">GitHub REST &amp; GraphQL API</text>
<text xml:space="preserve" text-anchor="start" x="235.06" y="-88" font-family="Arial" font-size="15.00" fill="#bfdbfe">External GitHub API providing Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="237.6" y="-70" font-family="Arial" font-size="15.00" fill="#bfdbfe">(trees, commits, refs), OAuth Device Flow,</text>
<text xml:space="preserve" text-anchor="start" x="258" y="-52" font-family="Arial" font-size="15.00" fill="#bfdbfe">user profiles, and commit comments</text>
</g>
<!-- reviewer&#45;&gt;chromeext -->
<g id="edge1" class="edge">
<title>reviewer&#45;&gt;chromeext</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M188.46,-1002.07C188.46,-960.87 188.46,-911.76 188.46,-869.37"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="191.09,-869.56 188.46,-862.06 185.84,-869.56 191.09,-869.56"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="188.46,-919.2 188.46,-942 434.88,-942 434.88,-919.2 188.46,-919.2"/>
<text xml:space="preserve" text-anchor="start" x="191.46" y="-925" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reviews PR markdown files on GitHub</text>
</g>
<!-- chromeext&#45;&gt;sharedengine -->
<g id="edge2" class="edge">
<title>chromeext&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M188.46,-679.5C188.46,-633.54 188.46,-577.27 188.46,-529.87"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="191.09,-530.11 188.46,-522.61 185.84,-530.11 191.09,-530.11"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="188.46,-579.6 188.46,-619.2 403.01,-619.2 403.01,-579.6 188.46,-579.6"/>
<text xml:space="preserve" text-anchor="start" x="191.46" y="-602.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and YAML</text>
<text xml:space="preserve" text-anchor="start" x="191.46" y="-585.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">serialization</text>
</g>
<!-- chromeext&#45;&gt;githubapi -->
<g id="edge3" class="edge">
<title>chromeext&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M370.39,-679.27C393.16,-661.94 414.14,-641.95 430.46,-619.2 530.76,-479.4 568.87,-401.11 508.46,-240 501.64,-221.8 491.47,-204.36 479.77,-188.23"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="481.95,-186.76 475.35,-182.34 477.76,-189.91 481.95,-186.76"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="537.38,-409.8 537.38,-449.4 776.8,-449.4 776.8,-409.8 537.38,-409.8"/>
<text xml:space="preserve" text-anchor="start" x="540.38" y="-432.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Interacts with GitHub Git Data API via</text>
<text xml:space="preserve" text-anchor="start" x="540.38" y="-415.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Device Flow</text>
</g>
<!-- sharedengine&#45;&gt;githubapi -->
<g id="edge4" class="edge">
<title>sharedengine&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M200,-340.08C206.8,-307.22 217.52,-270.55 234.36,-240 244.44,-221.72 257.34,-204.07 271.28,-187.71"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="273.26,-189.44 276.21,-182.06 269.3,-185.99 273.26,-189.44"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="234.36,-240 234.36,-279.6 485.46,-279.6 485.46,-240 234.36,-240"/>
<text xml:space="preserve" text-anchor="start" x="237.36" y="-262.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Fetches commit parent, base tree SHA,</text>
<text xml:space="preserve" text-anchor="start" x="237.36" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">and creates trees/commits</text>
</g>
</g>
</svg>
`;
      case `sharedInternals`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="1680pt" height="898pt"
 viewBox="0.00 0.00 1680.00 898.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 883.45)">
<g id="clust1" class="cluster">
<title>cluster_sharedengine</title>
<polygon fill="#194b9e" stroke="#1b3d88" points="8,-299.6 8,-580.8 1306,-580.8 1306,-299.6 8,-299.6"/>
<text xml:space="preserve" text-anchor="start" x="16" y="-567.9" font-family="Arial" font-weight="bold" font-size="11.00" fill="#bfdbfe" fill-opacity="0.701961">SHARED DOMAIN ENGINE</text>
</g>
<!-- gitrefbackend -->
<g id="node1" class="node">
<title>gitrefbackend</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="394.03,-519.6 47.97,-519.6 47.97,-339.6 394.03,-339.6 394.03,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="110.38" y="-469.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Git Ref Storage Backend</text>
<text xml:space="preserve" text-anchor="start" x="189.93" y="-448.4" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="78.84" y="-426.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Git Data API orphan ref backend with base</text>
<text xml:space="preserve" text-anchor="start" x="68.66" y="-408.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">tree SHA resolution (GET /git/commits/:sha &#45;&gt;</text>
<text xml:space="preserve" text-anchor="start" x="68.03" y="-390.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">tree.sha), 3&#45;way merge, and commit comment</text>
<text xml:space="preserve" text-anchor="start" x="181.39" y="-372.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">notifications</text>
</g>
<!-- localfilebackend -->
<g id="node2" class="node">
<title>localfilebackend</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="824.02,-519.6 503.98,-519.6 503.98,-339.6 824.02,-339.6 824.02,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="579.51" y="-451.4" font-family="Arial" font-size="20.00" fill="#eff6ff">Local File Backend</text>
<text xml:space="preserve" text-anchor="start" x="632.93" y="-430.4" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="528.93" y="-408.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">Local sidecar YAML storage backend for</text>
<text xml:space="preserve" text-anchor="start" x="526.41" y="-390.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">non&#45;git workspaces and offline evaluation</text>
</g>
<!-- anchorengine -->
<g id="node3" class="node">
<title>anchorengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1266.39,-519.6 933.61,-519.6 933.61,-339.6 1266.39,-339.6 1266.39,-519.6"/>
<text xml:space="preserve" text-anchor="start" x="983.82" y="-460.4" font-family="Arial" font-size="20.00" fill="#eff6ff">FNV&#45;1a Anchoring Engine</text>
<text xml:space="preserve" text-anchor="start" x="1068.93" y="-439.4" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="972.44" y="-417.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">FNV&#45;1a hash anchoring algorithm with</text>
<text xml:space="preserve" text-anchor="start" x="953.67" y="-399.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">surrounding context window and normalized</text>
<text xml:space="preserve" text-anchor="start" x="1000.37" y="-381.8" font-family="Arial" font-size="15.00" fill="#bfdbfe">fuzzy search fallback cascade</text>
</g>
<!-- vscodeext -->
<g id="node4" class="node">
<title>vscodeext</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="834.97,-868.4 493.03,-868.4 493.03,-688.4 834.97,-688.4 834.97,-868.4"/>
<text xml:space="preserve" text-anchor="start" x="525.04" y="-809.2" font-family="Arial" font-size="20.00" fill="#eff6ff">VS Code Extension Subsystem</text>
<text xml:space="preserve" text-anchor="start" x="560.67" y="-788.2" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, VS Code Extension API</text>
<text xml:space="preserve" text-anchor="start" x="518.92" y="-766.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">Desktop IDE extension hosting early hooks,</text>
<text xml:space="preserve" text-anchor="start" x="513.09" y="-748.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">auth resolution, optimistic state management,</text>
<text xml:space="preserve" text-anchor="start" x="586.45" y="-730.6" font-family="Arial" font-size="15.00" fill="#bfdbfe">and preview integration</text>
</g>
<!-- githubapi -->
<g id="node5" class="node">
<title>githubapi</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="1649.45,-180 1322.55,-180 1322.55,0 1649.45,0 1649.45,-180"/>
<text xml:space="preserve" text-anchor="start" x="1353.17" y="-111" font-family="Arial" font-size="20.00" fill="#eff6ff">GitHub REST &amp; GraphQL API</text>
<text xml:space="preserve" text-anchor="start" x="1342.6" y="-88" font-family="Arial" font-size="15.00" fill="#bfdbfe">External GitHub API providing Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="1345.14" y="-70" font-family="Arial" font-size="15.00" fill="#bfdbfe">(trees, commits, refs), OAuth Device Flow,</text>
<text xml:space="preserve" text-anchor="start" x="1365.54" y="-52" font-family="Arial" font-size="15.00" fill="#bfdbfe">user profiles, and commit comments</text>
</g>
<!-- gitrefstorage -->
<g id="node6" class="node">
<title>gitrefstorage</title>
<path fill="#3b82f6" stroke="#2563eb" stroke-width="2" d="M395.29,-163.64C395.29,-172.67 317.17,-180 221,-180 124.83,-180 46.71,-172.67 46.71,-163.64 46.71,-163.64 46.71,-16.36 46.71,-16.36 46.71,-7.33 124.83,0 221,0 317.17,0 395.29,-7.33 395.29,-16.36 395.29,-16.36 395.29,-163.64 395.29,-163.64"/>
<path fill="none" stroke="#2563eb" stroke-width="2" d="M395.29,-163.64C395.29,-154.61 317.17,-147.27 221,-147.27 124.83,-147.27 46.71,-154.61 46.71,-163.64"/>
<text xml:space="preserve" text-anchor="start" x="139.3" y="-120.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Git Ref Data Store</text>
<text xml:space="preserve" text-anchor="start" x="179.46" y="-99.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">Git Ref, YAML</text>
<text xml:space="preserve" text-anchor="start" x="89.29" y="-78.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Orphan git ref (refs/md&#45;comments/data)</text>
<text xml:space="preserve" text-anchor="start" x="66.77" y="-60.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">storing versioned YAML comments completely</text>
<text xml:space="preserve" text-anchor="start" x="139.28" y="-42.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">outside source branches</text>
</g>
<!-- gitrefbackend&#45;&gt;githubapi -->
<g id="edge4" class="edge">
<title>gitrefbackend&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M362.09,-339.71C390.13,-324.67 419.91,-310.44 449,-299.6 528.92,-269.82 1038.9,-173.42 1312.72,-122.76"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1312.88,-125.4 1319.78,-121.46 1311.93,-120.24 1312.88,-125.4"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="695.33,-240 695.33,-279.6 946.43,-279.6 946.43,-240 695.33,-240"/>
<text xml:space="preserve" text-anchor="start" x="698.33" y="-262.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">Fetches commit parent, base tree SHA,</text>
<text xml:space="preserve" text-anchor="start" x="698.33" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">and creates trees/commits</text>
</g>
<!-- gitrefbackend&#45;&gt;gitrefstorage -->
<g id="edge5" class="edge">
<title>gitrefbackend&#45;&gt;gitrefstorage</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M221,-339.9C221,-294.22 221,-238.34 221,-191.12"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="223.63,-191.39 221,-183.89 218.38,-191.4 223.63,-191.39"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="221,-248.4 221,-271.2 486.1,-271.2 486.1,-248.4 221,-248.4"/>
<text xml:space="preserve" text-anchor="start" x="224" y="-254.2" font-family="Arial" font-size="14.00" fill="#c9c9c9">Reads and writes refs/md&#45;comments/data</text>
</g>
<!-- vscodeext&#45;&gt;gitrefbackend -->
<g id="edge1" class="edge">
<title>vscodeext&#45;&gt;gitrefbackend</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M493.04,-697.55C457.07,-677.32 420.51,-653.97 388.99,-628.4 353.05,-599.24 318.9,-561.63 290.89,-527.05"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="293.28,-525.83 286.54,-521.62 289.18,-529.11 293.28,-525.83"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="388.99,-597.2 388.99,-620 637,-620 637,-597.2 388.99,-597.2"/>
<text xml:space="preserve" text-anchor="start" x="391.99" y="-603" font-family="Arial" font-size="14.00" fill="#c9c9c9">Synchronizes threads with Git backend</text>
</g>
<!-- vscodeext&#45;&gt;localfilebackend -->
<g id="edge2" class="edge">
<title>vscodeext&#45;&gt;localfilebackend</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M664,-688.54C664,-640.11 664,-580.03 664,-530.04"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="666.63,-530.06 664,-522.56 661.38,-530.06 666.63,-530.06"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="664,-588.8 664,-628.4 897.99,-628.4 897.99,-588.8 664,-588.8"/>
<text xml:space="preserve" text-anchor="start" x="667" y="-611.4" font-family="Arial" font-size="14.00" fill="#c9c9c9">Persists threads to local YAML when</text>
<text xml:space="preserve" text-anchor="start" x="667" y="-594.6" font-family="Arial" font-size="14.00" fill="#c9c9c9">offline</text>
</g>
<!-- vscodeext&#45;&gt;githubapi -->
<g id="edge3" class="edge">
<title>vscodeext&#45;&gt;githubapi</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M834.67,-770.89C984.97,-756.1 1200.06,-711.5 1333,-580.8 1438.85,-476.73 1471.73,-300.63 1481.78,-190.36"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="1484.39,-190.61 1482.42,-182.91 1479.16,-190.16 1484.39,-190.61"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="1465.21,-418.2 1465.21,-441 1492.2,-441 1492.2,-418.2 1465.21,-418.2"/>
<text xml:space="preserve" text-anchor="start" x="1468.21" y="-426.4" font-family="Arial" font-weight="bold" font-size="14.00" fill="#c9c9c9">[...]</text>
</g>
</g>
</svg>
`;
      case `starlightInternals`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="446pt" height="533pt"
 viewBox="0.00 0.00 446.00 533.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 517.85)">
<!-- starlightplugin -->
<g id="node1" class="node">
<title>starlightplugin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-502.8 0,-502.8 0,-322.8 320.04,-322.8 320.04,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="61.08" y="-443.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Astro / Starlight Plugin</text>
<text xml:space="preserve" text-anchor="start" x="89.58" y="-422.6" font-family="Arial" font-size="13.00" fill="#bfdbfe">Astro, TypeScript, CSS3</text>
<text xml:space="preserve" text-anchor="start" x="30.36" y="-401" font-family="Arial" font-size="15.00" fill="#bfdbfe">Documentation theme plugin and Astro</text>
<text xml:space="preserve" text-anchor="start" x="45.78" y="-383" font-family="Arial" font-size="15.00" fill="#bfdbfe">integration providing an interactive</text>
<text xml:space="preserve" text-anchor="start" x="69.57" y="-365" font-family="Arial" font-size="15.00" fill="#bfdbfe">slide&#45;over comment drawer</text>
</g>
<!-- sharedengine -->
<g id="node2" class="node">
<title>sharedengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="320.04,-180 0,-180 0,0 320.04,0 320.04,-180"/>
<text xml:space="preserve" text-anchor="start" x="56.62" y="-120.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared Domain Engine</text>
<text xml:space="preserve" text-anchor="start" x="128.95" y="-99.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="24.12" y="-78.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Core domain engine with FNV&#45;1a anchor</text>
<text xml:space="preserve" text-anchor="start" x="22.04" y="-60.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">hashing, fuzzy re&#45;anchoring, Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="52.04" y="-42.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">backend, and 3&#45;way merge logic</text>
</g>
<!-- starlightplugin&#45;&gt;sharedengine -->
<g id="edge1" class="edge">
<title>starlightplugin&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M160.02,-322.87C160.02,-281.67 160.02,-232.56 160.02,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="162.65,-190.36 160.02,-182.86 157.4,-190.36 162.65,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="160.02,-240 160.02,-262.8 415.81,-262.8 415.81,-240 160.02,-240"/>
<text xml:space="preserve" text-anchor="start" x="163.02" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and client drawer</text>
</g>
</g>
</svg>
`;
      case `obsidianInternals`:
        return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by graphviz version 15.0.0 (0)
 -->
<!-- Pages: 1 -->
<svg width="458pt" height="533pt"
 viewBox="0.00 0.00 458.00 533.00" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g id="graph0" class="graph" transform="scale(1 1) rotate(0) translate(15.05 517.85)">
<!-- obsidianplugin -->
<g id="node1" class="node">
<title>obsidianplugin</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="344.47,-502.8 0,-502.8 0,-322.8 344.47,-322.8 344.47,-502.8"/>
<text xml:space="preserve" text-anchor="start" x="102.19" y="-443.6" font-family="Arial" font-size="20.00" fill="#eff6ff">Obsidian Plugin</text>
<text xml:space="preserve" text-anchor="start" x="99.62" y="-422.6" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript, Obsidian API</text>
<text xml:space="preserve" text-anchor="start" x="20.06" y="-401" font-family="Arial" font-size="15.00" fill="#bfdbfe">Obsidian Vault plugin supporting reading view</text>
<text xml:space="preserve" text-anchor="start" x="33.83" y="-383" font-family="Arial" font-size="15.00" fill="#bfdbfe">anchors, live preview gutters, and sidebar</text>
<text xml:space="preserve" text-anchor="start" x="131.38" y="-365" font-family="Arial" font-size="15.00" fill="#bfdbfe">commenting</text>
</g>
<!-- sharedengine -->
<g id="node2" class="node">
<title>sharedengine</title>
<polygon fill="#3b82f6" stroke="#2563eb" stroke-width="0" points="332.25,-180 12.21,-180 12.21,0 332.25,0 332.25,-180"/>
<text xml:space="preserve" text-anchor="start" x="68.84" y="-120.8" font-family="Arial" font-size="20.00" fill="#eff6ff">Shared Domain Engine</text>
<text xml:space="preserve" text-anchor="start" x="141.17" y="-99.8" font-family="Arial" font-size="13.00" fill="#bfdbfe">TypeScript</text>
<text xml:space="preserve" text-anchor="start" x="36.33" y="-78.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">Core domain engine with FNV&#45;1a anchor</text>
<text xml:space="preserve" text-anchor="start" x="34.25" y="-60.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">hashing, fuzzy re&#45;anchoring, Git Data API</text>
<text xml:space="preserve" text-anchor="start" x="64.26" y="-42.2" font-family="Arial" font-size="15.00" fill="#bfdbfe">backend, and 3&#45;way merge logic</text>
</g>
<!-- obsidianplugin&#45;&gt;sharedengine -->
<g id="edge1" class="edge">
<title>obsidianplugin&#45;&gt;sharedengine</title>
<path fill="none" stroke="#8d8d8d" stroke-width="2" stroke-dasharray="5,2" d="M172.23,-322.87C172.23,-281.67 172.23,-232.56 172.23,-190.17"/>
<polygon fill="#8d8d8d" stroke="#8d8d8d" stroke-width="2" points="174.86,-190.36 172.23,-182.86 169.61,-190.36 174.86,-190.36"/>
<polygon fill="#18191b" fill-opacity="0.627451" stroke="none" points="172.23,-240 172.23,-262.8 428.04,-262.8 428.04,-240 172.23,-240"/>
<text xml:space="preserve" text-anchor="start" x="175.23" y="-245.8" font-family="Arial" font-size="14.00" fill="#c9c9c9">Uses anchor matching and local storage</text>
</g>
</g>
</svg>
`;
      default:
        throw Error(`Unknown viewId: ` + e);
    }
  };
export { e as dotSource, t as svgSource };
