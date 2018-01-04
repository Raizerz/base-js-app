const viewConstants = {
    USERS: 'users',
    POSTS: 'posts'
}
const BASE_URL = 'https://jsonplaceholder.typicode.com';
let store = {
    _state: {
        users: {
            data: null,
            isLoading: false,
            error: null,
            filteredData: null
        },
        currentView: viewConstants.USERS
    },
    _listeners: [],
    getState() {
        return this._state;
    },
    subscribe(callback) {
        this._listeners.push(callback);
        callback(this._state);
    },
    updateState(newState) {
        Object.assign(this._state, newState);
        this._listeners.forEach(callback => callback(this._state));
    }
};

const actions = {
    fetchUsers() {
        const { users } = store.getState();
        const updatedUsers = Object.assign({}, users, {
            isLoading: true
        });
        store.updateState({ users: updatedUsers });
        console.log(store.getState().users)
        fetch(`${BASE_URL}/users`)
            .then(response => response.json())
            .then(data => {
                store.updateState({
                    users: {
                        data,
                        filteredData: data,
                        isLoading: false,
                        error: null
                    }
                });
            })
            .catch(error => {
                const { users } = store.getState();
                const updatedUsers = Object.assign({}, users, {
                    isLoading: false,
                    error
                });
                store.updateState({ users: updatedUsers });
            });
    },
    fetchUserPosts(userId) {
        return fetch(`${BASE_URL}/posts?userId=${userId}`).then(response => response.json());
    },
    filterUsers(value) {
        const { users } = store.getState();
        const filteredUsers = users.data.filter(({ name }) => (
            name.toLowerCase().includes(value.toLowerCase())
        ));
        const updatedUsers = Object.assign({}, users, {
            filteredData: filteredUsers
        })
        store.updateState({ users: updatedUsers });
    }
};

let wrapperComponent = {
    render(parentNode) {
        let elementNode = document.getElementById('app-wrappper');
        if (!elementNode) {
            elementNode = document.createElement('div');
            elementNode.setAttribute('id', 'app-wrappper');
            parentNode.appendChild(elementNode);
        }
        return elementNode;
    }
}

let usersComponent = {
    _parentNode: null,
    initialRender(parentNode) {
        this._parentNode = parentNode;
        let elementNode = null;
        store.subscribe(state => {
            elementNode = this.render({
                users: state.users
            });
        });
        actions.fetchUsers();
    },
    render({ parentNode = this._parentNode, users }) {
        let elementNode = document.getElementById('users');
        if (!elementNode) {
            elementNode = document.createElement('div');
            elementNode.setAttribute('id', 'users');
            parentNode.appendChild(elementNode);
        }
        let template = '';
        if (users.isLoading || !users.filteredData) {
            template = '<div class="text-center">Loading...</div>'
        } else {
            template = `
                <ul class="list-group">
                    ${users.filteredData.map(user => (
                        `<li class="list-group-item">
                            <div>
                                <label>Name:</label>
                                ${user.name}
                            </div>
                            <div>
                                <label>Email:</label>
                                ${user.email}
                            </div>
                            <div>
                                <label>Phone:</label>
                                ${user.phone}
                            </div>
                        </li>`
                    )).join('\n')}
                </ul>
            `;
        }
        elementNode.innerHTML = template;
        return elementNode;
    }
}

let inputComponent = {
    _parentNode: null,
    initialRender(parentNode) {
        this._parentNode = parentNode;
        let elementNode = this.render();
        elementNode.addEventListener('input', this.handleUserInput.bind(this));
    },
    handleUserInput(e) {
        const { value } = e.target;
        const { users } = store.getState();
        if (users.isLoading || !users.data || !this._parentNode) {
            return false;
        }
        actions.filterUsers(value);
    },
    render(parentNode = this._parentNode) {
        let elementNode = document.getElementById('input-wrapper');
        if (!elementNode) {
            elementNode = document.createElement('div');
            elementNode.className = 'form-group';
            elementNode.setAttribute('id', 'input-wrapper');
            parentNode.appendChild(elementNode);
        }
        elementNode.innerHTML = `
            <input type="text" class="form-control" id="user-input" placeholder="Search user...">
        `;
        return elementNode;
    }

}
const init = function(parentNode) {
    const wrapperNode = wrapperComponent.render(parentNode);
    inputComponent.initialRender(wrapperNode);
    usersComponent.initialRender(wrapperNode)
}

init(document.getElementById('container'));
