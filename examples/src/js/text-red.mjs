const redRole = {
    name: 'red',
    doc: 'An example role that sets a custom class.',
    body: {
        type: 'myst',
        required: true,
    },
    run(data) {
        console.log('[TextRed] Running role');
        const children = data.body;
        children.forEach((child) => {
            child.class = child.class ? `${child.class} red` : 'red';
            console.log('[TextRed] Applied class:', child);
        });
        return children;
    },
};

const plugin = { name: 'Example role', roles: [redRole] };

console.log('[TextRed] Plugin loaded');

export default plugin;