import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Dimensions, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { Card, Text } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

export default function TabTwoScreen() {

  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'light' ? '#F0F0F0' : '#353636';
  const iconColor = colorScheme === 'light' ? '#000000' : '#ffffff';
  const textColor = colorScheme === 'light' ? '#555555' : '#EEEEEE';
  const cardColor = colorScheme === 'light' ? '#ffffffff' : '#000000ff';
  return (

<ThemedView style={{ flex: 1, backgroundColor }}>
<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
<ThemedView style={[styles.TopBar, { backgroundColor }]}>
  <ThemedView style={[styles.HeaderItems, { backgroundColor }]}>
    <FontAwesome
      name="group"
      size={130}
      color={iconColor}
    />
    <ThemedText
      type="title"
      style={styles.headerText}
    >Quem Somos
    </ThemedText>
  </ThemedView>
</ThemedView>



<Card style={[styles.cardStyle, { backgroundColor: cardColor }]}>
  <Card.Cover
    source={require('@/assets/images/Victor_Percio.jpg')}
    style={styles.PhotoStyles}
  />
  <Card.Content style={styles.CardContent}>
  <Text style={[styles.CardtitleText, { color: textColor }]}>Victor Percio</Text>
  </Card.Content>
   <Card.Content style={styles.CardContent}>
   <Text style={[styles.CardText, { color: textColor }]}>Software e Eletrônica</Text>
  </Card.Content>
</Card>

  
<Card style={[styles.cardStyle, { backgroundColor: cardColor }]}>
  <Card.Cover
    source={require('@/assets/images/Catherine.jpeg')}
    style={styles.PhotoStyles}
  />
  <Card.Content style={styles.CardContent}>
  <Text style={[styles.CardtitleText, { color: textColor }]}>Catherine Calegari</Text>
  </Card.Content>
   <Card.Content style={styles.CardContent}>
   <Text style={[styles.CardText, { color: textColor }]}>Software e Eletrônica</Text>
  </Card.Content>
</Card>


<Card style={[styles.cardStyle, { backgroundColor: cardColor }]}>
  <Card.Cover
    source={require('@/assets/images/Ana.jpeg')}
    style={styles.PhotoStyles}
  />
  <Card.Content style={styles.CardContent}>
  <Text style={[styles.CardtitleText, { color: textColor }]}>Ana Clara</Text>
  </Card.Content>
   <Card.Content style={styles.CardContent}>
   <Text style={[styles.CardText, { color: textColor }]}>Mecânica</Text>
  </Card.Content>
</Card>


<Card style={[styles.cardStyle, { backgroundColor: cardColor }]}>
  <Card.Cover
    source={require('@/assets/images/Andre.jpeg')}
    style={styles.PhotoStyles}
  />
  <Card.Content style={styles.CardContent}>
  <Text style={[styles.CardtitleText, { color: textColor }]}>André Ruiz</Text>
  </Card.Content>
   <Card.Content style={styles.CardContent}>
   <Text style={[styles.CardText, { color: textColor }]}>Mecânica e Eletrônica</Text>
  </Card.Content>
</Card>


<Card style={[styles.cardStyle, { backgroundColor: cardColor }]}>
  <Card.Cover
    source={require('@/assets/images/Stocco.jpeg')}
    style={styles.PhotoStyles}
  />
  <Card.Content style={styles.CardContent}>
  <Text style={[styles.CardtitleText, { color: textColor }]}>Guilherme Stocco</Text>
  </Card.Content>
   <Card.Content style={styles.CardContent}>
   <Text style={[styles.CardText, { color: textColor }]}>Eletrônica</Text>
  </Card.Content>
</Card>

</ScrollView>
</ThemedView>

  );
}

const styles = StyleSheet.create({
TopBar: {
  width: '100%',
  height: 240,
  justifyContent: 'center',
  alignItems: 'center',
},

HeaderItems: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: 15,
  marginTop: 35,

},

headerText: {
  fontSize: 36,
  fontWeight: 'bold',
  marginBottom: 50,
},

  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  

  CardContent: {
    alignItems: 'center',
  },

 CardtitleText: {
  fontSize: 35,
  color: '#555555ff',
  fontWeight: 'bold',
},

CardText: {
  fontSize: 20,
  color: '#555555ff',
},

  PhotoStyles: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center', 
    marginTop: 20,
  },

  cardStyle: {
  width: screenWidth * 0.95,
  alignSelf: 'center',
  borderRadius: 16,
  padding: 10,
  marginVertical: 10,
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
headerContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 20,
},

headerIcon: {
  marginBottom: 10,
},


headerOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
},

});
