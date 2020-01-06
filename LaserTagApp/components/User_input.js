import React, { Component } from 'react'
import {StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome';
import { SearchBar } from 'react-native-elements';

export default class UserInput extends Component {

  state = {
    search: '',
  }

  updateSearch = search => {
    this.setState({ search });
  };

  onSubmitEditing = () => {
    const {onSubmitEditing} = this.props
    const {search} = this.state
    console.log("WTF",search)
    if (!search) return // Don't submit if empty

    onSubmitEditing(search)
    this.setState({search: ''})
  }

  render() {
    const {placeholder} = this.props
    const { search } = this.state;


    return (
      <SearchBar
        placeholder={this.props.placeholder}
        onChangeText={this.updateSearch}
        onSubmitEditing={this.onSubmitEditing}
        showLoading = {this.props.loading}
        value={search}
      />
    )
  }
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    height: 50,
    fontSize: 18,
    alignContent: 'center'
  },
})
