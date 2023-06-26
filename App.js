import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('beer.db');

const Cerveja = () => {
  const [beerData, setBeerData] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    createBeerTable();
    loadSearchHistory();
  }, []);

  const createBeerTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        `
        CREATE TABLE IF NOT EXISTS beers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brand TEXT,
          name TEXT,
          style TEXT,
        )
        `
      );
    });
  };

  const fetchRandomBeer = async () => {
    try {
      const response = await fetch('https://random-data-api.com/api/beer/random_beer');
      const data = await response.json();
      setBeerData(data);

      db.transaction(tx => {
        if (tx.executeSql) {
          tx.executeSql(
            'INSERT INTO beers (brand, name, style, yeast, malts, alcohol) VALUES (?, ?, ?)',
            [data.brand, data.name, data.style],
            (_, resultSet) => {
              if (resultSet.rowsAffected > 0) {
                console.log('Cerveja inserida!');
              }
            },
            (_, error) => {
              console.error('Erro ao inserir!', error);
            }
          );
        } else {
          console.warn('executeSql não está disponível');
        }
      });

      loadSearchHistory();
    } catch (error) {
      console.error('Erro ao carregar:', error);
    }
  };

  const loadSearchHistory = () => {
    db.transaction(tx => {
      if (tx.executeSql) {
        tx.executeSql('SELECT * FROM beers', [], (_, resultSet) => {
          const entries = resultSet.rows.raw().map(row => ({
            id: row.id,
            brand: row.brand,
            name: row.name,
            style: row.style,
          }));
          setSearchHistory(entries);
        });
      } else {
        console.warn('executeSql não está disponível');
      }
    });
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity onPress={() => showBeerDetails(item)}>
      <View style={styles.searchItem}>
        <Text style={styles.searchItemText}>Brand: {item.brand}</Text>
        <Text style={styles.searchItemText}>Name: {item.name}</Text>
        <Text style={styles.searchItemText}>Style: {item.style}</Text>
      </View>
    </TouchableOpacity>
  );

  const showBeerDetails = beer => {
    setBeerData(beer);
  };

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <Button title="Buscar Cerveja" onPress={fetchRandomBeer} color="#FF5722" />

      {beerData && (
        <View style={styles.beerDetails}>
          <Text style={styles.beerDetailText}>Brand: {beerData.brand}</Text>
          <Text style={styles.beerDetailText}>Name: {beerData.name}</Text>
          <Text style={styles.beerDetailText}>Style: {beerData.style}</Text>
        </View>
      )}

      <Text style={styles.searchHistoryTitle}>Histórico de pedidos:</Text>
      <FlatList
        data={searchHistory}
        renderItem={renderSearchItem}
        keyExtractor={item => item.id.toString()}
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '25%',
    backgroundColor: '#F5FCFF',
  },
  beerDetails: {
    marginTop: 20,
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 5,
  },
  beerDetailText: {
    fontSize: 16,
    marginBottom: 5,
  },
  searchHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  searchItem: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  searchItemText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#FF5722',
    marginVertical: 4,
  },
});

export default Cerveja;
